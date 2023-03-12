// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FaucetSimpleChecker {
    uint256 public blockCount;
    mapping (address => mapping (address => uint256)) public blockNumForAddr;
    mapping (address => mapping (uint256 => uint256)) public blockNumForHash;
    address owner;

    modifier onlyOwner{
        require(msg.sender == owner);
        _;
    }

    constructor() {
        blockCount = 14400;
    }

    function transfer(address to, uint256 hash) public payable {    
        require(msg.value > 0, "Your value must be greater than zero");
        require(block.number - blockNumForAddr[msg.sender][to] > blockCount, "Transfer to the specified address is not possible in the near future");
        require(block.number - blockNumForHash[msg.sender][hash] > blockCount, "Transfer to the specified hash is not possible in the near future");
        blockNumForAddr[msg.sender][to] = block.number;
        blockNumForHash[msg.sender][hash] = block.number;
        payable(to).transfer(msg.value);
        emit Transfer(msg.sender, to, msg.value);
    }

    function setBlockCount(uint256 value) public onlyOwner {
        blockCount = value;
    }

    function setOwner(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    event Transfer(address from, address to, uint256 value);
}