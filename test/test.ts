import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Signed Sealed Delivered", function () {

  async function deployContracts() {
    
    const [deployer, alice, bob, francis] = await ethers.getSigners();

    const uri = "https://ipfs.io/ipfs/bafybeiberpia3qev7lvnusiiheqqfe57sk5r23gs6fh7v3v6vdcw6wrldq/metadata.json";
    const Sugar = await ethers.getContractFactory("Sugar");
    const sugar = await Sugar.deploy(alice.address, bob.address, uri);

    const SSD = await ethers.getContractFactory("SSD");
    const ssd = await SSD.deploy(sugar.address);

    return { ssd, sugar, deployer, alice, bob, francis };
  }

  describe("Deployment", function () {

    it("Should own the right token IDs", async function () {
      const { sugar, alice, bob } = await loadFixture(deployContracts);
      expect(await sugar.ownerOf(0)).to.equal(alice.address);
      expect(await sugar.ownerOf(1)).to.equal(bob.address);
    });

    it("Should set the right token address", async function () {
      const { ssd, sugar } = await loadFixture(deployContracts);
      expect(await ssd.token()).to.equal(sugar.address);
    }); 

    xit("Should transfer the NFT contract ownership", async function () {
      const { ssd, sugar } = await loadFixture(deployContracts);
      expect(await sugar.owner()).to.equal(ssd.address);
    }); 

  });

  describe("Interactions", function () {

    it("Should add a new member", async function () {
      const { sugar, francis } = await loadFixture(deployContracts);
      const uri = await sugar.tokenURI(0)
      await sugar.safeMint(francis.address, uri)
      expect(await sugar.ownerOf(2)).to.equal(francis.address);
    }); 

    it("Should ban Francis (govBurn)", async function () {
      const { sugar, francis } = await loadFixture(deployContracts);
      const uri = await sugar.tokenURI(0)
      await sugar.safeMint(francis.address, uri) 
      await sugar.govBurn(2) // to be replaced with a burn
      expect(sugar.ownerOf(2)).to.be.reverted;
    }); 

    it("Should delegate to self", async function () {
      const { sugar, alice, francis } = await loadFixture(deployContracts);
      await sugar.connect(alice).delegate(alice.address)
      expect(await sugar.delegates(alice.address)).to.equal(alice.address);
    }); 

    xit('Should submit a proposal', async function () {

    const { sugar, ssd, alice } = await loadFixture(deployContracts);
      await sugar.connect(alice).delegate(alice.address)

      const targets = ["0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977"] // address[]
      const values = ["10000000000000"] // uint256[]
      const calldatas = ["0x"] // bytes[]
      const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("{ result: { kind: 'valid', asString: '# Simple proposal\n**It\'s simple.**' } }")) // bytes32
      
      const hashProposal = await ssd.connect(alice).hashProposal(
        targets, 
        values, 
        calldatas, 
        descriptionHash
      )

      console.log(hashProposal.toString())

      await ssd.connect(alice).propose(
        targets, 
        values, 
        calldatas, 
        descriptionHash
      )

      await time.increase(10);

      await ssd.connect(alice).castVoteWithReason(
        hashProposal.toString(),
        1,
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("{ result: { kind: 'valid', asString: 'hey' } }"))
      )

      await time.increase(300);
      
      expect(await ssd.proposalSnapshot(hashProposal.toString())).to.equal("0");
    });

    xit('Should cast a vote', async function () {
      // alice should vote
      // bob should vote
      // francis can't vote
    });

    xit('Should execute the proposal', async function () {
      // francis executes
    });

  });
});