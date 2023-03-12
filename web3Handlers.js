const ethers = require("ethers");
const config = require('./config.json');
const os = require('os');

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

function getMacAddress() {
    const interfaces = os.networkInterfaces();
    let macAddress = null;
  
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
  
      for (const info of iface) {
        if (info.mac && info.mac !== '00:00:00:00:00:00') {
          macAddress = info.mac;
          break;
        }
      }
  
      if (macAddress) {
        break;
      }
    }
  
    return macAddress;
  }

async function getWalletBalance(address) {
    const result = await provider.getBalance(address);
    return {
        value: result,
        ethValue: ethers.utils.formatEther(result),
    }
}

async function sendEthToWallet(toAddress) {
    if (!ethers.utils.isAddress(toAddress)) {
        return {
            result: false,
            message: `Error, is invalid address: ${toAddress}`,
        };
    }
    const formattedMacAddress = getMacAddress().toLowerCase().replace(/:/g, '-');
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(formattedMacAddress));
    return await _sendEthToWallet(toAddress, hash);
}