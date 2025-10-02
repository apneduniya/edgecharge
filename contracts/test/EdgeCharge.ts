import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { network } from "hardhat";
import { keccak256, toBytes } from "viem";


describe("EdgeCharge", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  let owner: any;
  let relayer: any;
  let provider: any;
  let enterprise: any;
  let otherAccount: any;

  let edgeCharge: any;
  let deploymentBlockNumber: bigint;

  beforeEach(async function () {
    const wallets = await viem.getWalletClients();
    [owner, relayer, provider, enterprise, otherAccount] = wallets; // this is an array of wallet clients. All accounts are different.

    edgeCharge = await viem.deployContract("EdgeCharge");
    deploymentBlockNumber = await publicClient.getBlockNumber();

    await edgeCharge.write.authorizeRelayer([relayer.account.address]);
  });

  describe("Deployment", async function () {
    it("Should set the right owner and initial values", async function () {
      const contractOwner = await edgeCharge.read.owner();
      assert.equal(contractOwner.toLowerCase(), owner.account.address.toLowerCase());

      const nextInvoiceId = await edgeCharge.read.nextInvoiceId();
      assert.equal(nextInvoiceId, 1n)
    });
  });

  describe("Relayer Management", async function () {
    it("Should authorize and revoke relayer", async function () {
      const isAuthorized = await edgeCharge.read.authorizedRelayers([
        relayer.account.address,
      ]);
      assert.equal(isAuthorized, true);

      await edgeCharge.write.revokeRelayer([relayer.account.address]);
      const isAuthorizedAfter = await edgeCharge.read.authorizedRelayers([
        relayer.account.address,
      ]);
      assert.equal(isAuthorizedAfter, false);
    });

    it("Should only allow owner to manage relayers", async function () {
      await assert.rejects(
        edgeCharge.write.authorizeRelayer([otherAccount.account.address], {
          account: otherAccount.account,
        }),
        /OwnableUnauthorizedAccount|Not authorized|caller is not the owner/i,
      );
    });
  });

  describe("Usage Anchoring", async function () {
    const windowStart = BigInt(Math.floor(Date.now() / 1000) - 3600);
    const windowEnd = BigInt(Math.floor(Date.now() / 1000));
    const merkleRoot = keccak256(toBytes("test merkle root"));
    const totalUsage = 1000n;

    it("Should submit usage anchor successfully", async function () {
      await edgeCharge.write.submitUsageAnchor(
        [provider.account.address, windowStart, windowEnd, merkleRoot, totalUsage],
        { account: relayer.account },
      );

      const events = await publicClient.getContractEvents({
        address: edgeCharge.address,
        abi: edgeCharge.abi,
        eventName: "UsageAnchored",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });
      assert.ok(events.length > 0);
      const { args } = events[events.length - 1] as any;
      const anchorId = args.anchorId as `0x${string}`;

      const anchor = await edgeCharge.read.getUsageAnchor([anchorId]);
      // Struct returns as an object with named fields via viem plugin
      assert.equal(anchor.provider.toLowerCase(), provider.account.address.toLowerCase());
      assert.equal(anchor.windowStart, windowStart);
      assert.equal(anchor.windowEnd, windowEnd);
      assert.equal(anchor.merkleRoot, merkleRoot);
      assert.equal(anchor.totalUsage, totalUsage);
      assert.equal(anchor.disputed, false);
    });

    it("Should reject invalid usage anchor data", async function () {
      await assert.rejects(
        edgeCharge.write.submitUsageAnchor(
          ["0x0000000000000000000000000000000000000000", windowStart, windowEnd, merkleRoot, totalUsage],
          { account: relayer.account },
        ),
        /Invalid provider/i,
      );

      await assert.rejects(
        edgeCharge.write.submitUsageAnchor(
          [provider.account.address, windowEnd, windowStart, merkleRoot, totalUsage],
          { account: relayer.account },
        ),
        /Invalid time window/i,
      );

      await assert.rejects(
        edgeCharge.write.submitUsageAnchor(
          [provider.account.address, windowStart, windowEnd, merkleRoot, 0n],
          { account: relayer.account },
        ),
        /Invalid usage amount/i,
      );
    });

    it("Should only allow authorized relayers to submit anchors", async function () {
      await assert.rejects(
        edgeCharge.write.submitUsageAnchor(
          [provider.account.address, windowStart, windowEnd, merkleRoot, totalUsage],
          { account: otherAccount.account },
        ),
        /Not authorized relayer/i,
      );
    });
  });

  describe("Invoice Management", async function () {
    const invoiceId = 1n; // 1n is a bigint literal = 1
    const invoiceHashPromise = Promise.resolve(
      keccak256(toBytes("test invoice")), // test invoice is a string = "test invoice"
    );

    it("Should anchor invoice successfully", async function () {
      const invoiceHash = await invoiceHashPromise;
      await edgeCharge.write.anchorInvoice([invoiceId, invoiceHash], {
        account: relayer.account,
      });

      const invoice = await edgeCharge.read.getInvoice([invoiceId]);
      assert.equal(invoice.invoiceHash, invoiceHash);
      assert.equal(invoice.provider.toLowerCase(), relayer.account.address.toLowerCase());
      assert.equal(invoice.paid, false);
      assert.equal(invoice.exists, true);
    });

    it("Should mark invoice as paid", async function () {
      const invoiceHash = await invoiceHashPromise;
      await edgeCharge.write.anchorInvoice([invoiceId, invoiceHash], {
        account: relayer.account,
      });

      await edgeCharge.write.markInvoicePaid([invoiceId], {
        account: relayer.account,
      });

      const events = await publicClient.getContractEvents({
        address: edgeCharge.address,
        abi: edgeCharge.abi,
        eventName: "InvoicePaid",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });
      assert.ok(events.length > 0);

      const invoice = await edgeCharge.read.getInvoice([invoiceId]);
      assert.equal(invoice.paid, true);
    });

    it("Should reject invalid invoice operations", async function () {
      const invoiceHash = await invoiceHashPromise;
      await assert.rejects(
        edgeCharge.write.anchorInvoice([0n, invoiceHash], { account: relayer.account }),
        /Invalid invoice ID/i,
      );

      await assert.rejects(
        edgeCharge.write.anchorInvoice([
          1n,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ], { account: relayer.account }),
        /Invalid invoice hash/i,
      );

      await assert.rejects(
        edgeCharge.write.markInvoicePaid([invoiceId], { account: relayer.account }),
        /Invoice does not exist/i,
      );
    });
  });

  describe("Dispute Resolution", async function () {
    const windowStart = BigInt(Math.floor(Date.now() / 1000) - 3600); // 1 hour ago
    const windowEnd = BigInt(Math.floor(Date.now() / 1000)); // now
    const totalUsage = 1000n; // 1000 units of usage
    let merkleRoot: `0x${string}`;
    let anchorId: `0x${string}`;

    beforeEach(async function () {
      merkleRoot = keccak256(toBytes("test merkle root"));

      await edgeCharge.write.submitUsageAnchor(
        [provider.account.address, windowStart, windowEnd, merkleRoot, totalUsage],
        { account: relayer.account },
      );

      const events = await publicClient.getContractEvents({
        address: edgeCharge.address,
        abi: edgeCharge.abi,
        eventName: "UsageAnchored",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });
      const { args } = events[events.length - 1] as any;
      anchorId = args.anchorId as `0x${string}`;
    });

    it("Should open dispute successfully", async function () {
      await edgeCharge.write.openDispute([anchorId, "Invalid usage data"], {
        account: otherAccount.account,
      });

      const anchor = await edgeCharge.read.getUsageAnchor([anchorId]);
      assert.equal(anchor.disputed, true);
    });

    it("Should reject invalid dispute operations", async function () {
      await assert.rejects(
        edgeCharge.write.openDispute([
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "reason",
        ], { account: otherAccount.account }),
        /Anchor does not exist/i,
      );

      await assert.rejects(
        edgeCharge.write.openDispute([anchorId, ""], {
          account: otherAccount.account,
        }),
        /Dispute reason required/i,
      );

      await edgeCharge.write.openDispute([anchorId, "Invalid usage data"], {
        account: otherAccount.account,
      });

      await assert.rejects(
        edgeCharge.write.openDispute([anchorId, "Invalid usage data"], {
          account: otherAccount.account,
        }),
        /Anchor already disputed/i,
      );
    });
  });

  describe("Merkle Proof Verification", async function () {
    const windowStart = BigInt(Math.floor(Date.now() / 1000) - 3600); // 1 hour ago
    const windowEnd = BigInt(Math.floor(Date.now() / 1000)); // now
    const totalUsage = 1000n; // 1000 units of usage

    it("Should verify (false) for dummy merkle proof and reject for missing anchor", async function () {
      const merkleRoot = keccak256(toBytes("test merkle root"));

      await edgeCharge.write.submitUsageAnchor(
        [provider.account.address, windowStart, windowEnd, merkleRoot, totalUsage],
        { account: relayer.account },
      );

      const events = await publicClient.getContractEvents({
        address: edgeCharge.address,
        abi: edgeCharge.abi,
        eventName: "UsageAnchored",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });
      const { args } = events[events.length - 1] as any;
      const anchorId = args.anchorId as `0x${string}`;

      const leaf = keccak256(toBytes("test leaf"));
      const proof = [keccak256(toBytes("test proof"))] as `0x${string}`[];
      const isValid = await edgeCharge.read.verifyMerkleProof([
        anchorId,
        leaf,
        proof,
      ]);
      assert.equal(isValid, false);

      await assert.rejects(
        edgeCharge.read.verifyMerkleProof([
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          leaf,
          [],
        ]),
        /Anchor does not exist/i,
      );
    });
  });

  describe("Dishonest Relayer Scenario", async function () {
    it("Should allow dispute when relayer submits fake data", async function () {
      const fakeMerkleRoot = keccak256(toBytes("fake data"));
      const windowStart = BigInt(Math.floor(Date.now() / 1000) - 3600);
      const windowEnd = BigInt(Math.floor(Date.now() / 1000));
      const totalUsage = 1000n;

      await edgeCharge.write.submitUsageAnchor(
        [provider.account.address, windowStart, windowEnd, fakeMerkleRoot, totalUsage],
        { account: relayer.account },
      );

      const events = await publicClient.getContractEvents({
        address: edgeCharge.address,
        abi: edgeCharge.abi,
        eventName: "UsageAnchored",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });
      const { args } = events[events.length - 1] as any;
      const anchorId = args.anchorId as `0x${string}`;

      await edgeCharge.write.openDispute([
        anchorId,
        "Relayer submitted fake aggregate data",
      ], { account: otherAccount.account });

      const anchor = await edgeCharge.read.getUsageAnchor([anchorId]);
      assert.equal(anchor.disputed, true);
    });
  });
});


