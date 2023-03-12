const ethers = require("ethers");
const config = require('./config.json');

// creating a new Provider, and passing in our node URL
const provider = new ethers.providers.JsonRpcProvider(config.node);
const faucetWallet = new ethers.Wallet(config.privateKey, provider);
const faucetContract = new ethers.Contract(config.contractAddress, config.contractAbi, faucetWallet);
const amount = ethers.BigNumber.from((config.amountEth * Math.pow(10, 18)).toFixed(0));

async function _sendEthToWallet(toAddress, hash) {
    try { 
        const gasPrice = await provider.getGasPrice();
        // const gasLimit = await faucetContract.estimateGas.transfer(toAddress, hash, { value: amount });
        const gasLimit = ethers.BigNumber.from(300000);
        const balance = (await getWalletBalance(faucetWallet.address)).value;
        const val = balance.sub(gasLimit.mul(gasPrice)).sub(amount);
        if (val.isNegative()) {
            return {
                result: false,
                message: `Error, balance is insufficient`,
            };
        } else {
            try {
                const tx = await faucetContract.transfer(toAddress, hash, { 
                    value: amount, 
                    gasLimit: gasLimit 
                });
                const result = await _getTransactionStatus(tx.hash);                
                return {
                    result: result,
                    message: `Transaction sent, txHash: ${tx.hash}`,
                };
            } catch (error) {
                return {
                    result: false,
                    message: `Error: ${error}`,
                };
            }
        }
    } catch (error) {
        return {
            result: false,
            message: `Unknown error: ${error.message}`,
        };
    }
}

async function _getTransactionStatus(txHash) {
    let receipt = null;
    while (receipt === null) {
      receipt = await provider.getTransactionReceipt(txHash);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return receipt.status === 1;;
}

async function _stringToHash(_string) {
    const bytesToHash = ethers.utils.formatBytes32String(_string);
    return ethers.utils.keccak256(bytesToHash);
}

async function getWalletBalance(address) {
    const result = await provider.getBalance(address);
    return {
        value: result,
        ethValue: ethers.utils.formatEther(result),
    }
}

async function sendEthToWallet(toAddress, stringToHash) {
    const hash = _stringToHash(stringToHash);
    const isValid = await isValidAddress(toAddress, hash);
    if (!isValid.result) {
        return isValid;
    }
    
    return await _sendEthToWallet(toAddress, hash);
}

async function isValidAddress(toAddress, stringToHash) {
    if (!ethers.utils.isAddress(toAddress)) {
        return {
            result: false,
            message: `Error, is invalid address: ${toAddress}`,
        };
    }
    const hash = _stringToHash(stringToHash);
    const blockNumber = ethers.BigNumber.from(await provider.getBlockNumber());
    const blockCount = ethers.BigNumber.from(await faucetContract.blockCount());
    const blockNumForAddr = ethers.BigNumber.from(await faucetContract.blockNumForAddr(faucetWallet.address, toAddress));
    const blockNumForHash = ethers.BigNumber.from(await faucetContract.blockNumForHash(faucetWallet.address, hash));
    if (blockNumber.sub(blockCount).sub(blockNumForAddr).isNegative || blockNumber.sub(blockCount).sub(blockNumForHash).isNegative) {
        return {
            result: false,
            message: `Error, cannot be transferred to ${toAddress}. Wait for a while.`,
        };
    } else {
        return {
            result: true,
            message: `Ready for transfer`,
        };
    }
}

module.exports = {
    getWalletBalance: getWalletBalance,
    sendEthToWallet: sendEthToWallet,
    isValidAddress: isValidAddress,
  }