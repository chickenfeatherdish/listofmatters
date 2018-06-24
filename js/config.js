"use strict";
// c11d8bb0faf7cfbfd67ac08972d0fda916f4bf9b0658e29fbaed0f88fdca1bc6
var config = {
  dappAddress: 'n1mcZjA5HomGdD4nUNhwJLQoJuv3kHJcjQz',
  // mode: 'https://testnet.nebulas.io',
  mode: 'https://Mainnet.nebulas.io',
}
let mobile = /Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent);
var is_weixin = (function () {
  return navigator.userAgent.toLowerCase().indexOf('micromessenger') !== -1
})();
let MessageBox = Vue.prototype.$message;
let Prompt = Vue.prototype.$prompt;
let Loading = Vue.prototype.$loading;
let Notification = Vue.prototype.$notify;
let Confirm = Vue.prototype.$confirm;
var intervalQuery
let nebulas = require("nebulas");
let Account = nebulas.Account;
let neb = new nebulas.Neb();
let from = Account.NewAccount().getAddressString();
neb.setRequest(new nebulas.HttpRequest(config.mode));
// neb.setRequest(new nebulas.HttpRequest("https://Mainnet.nebulas.io"));
let NebPay = require("nebpay"); //https://github.com/nebulasio/nebPay
let nebPay = new NebPay();
let loadingInstance = null;
let time = null;


var dapp = {
  nickname: '',
  content: '',
  from: '',
  getout() {
    if (!mobile && typeof webExtensionWallet === "undefined") {
      confirm('请先在谷歌浏览器安装星云链钱包插件', '');
      window.open(
        "https://github.com/ChengOrangeJu/WebExtensionWallet"
      );
      return false;
    }
    if (is_weixin) {
      alert('请点开右上角...按钮，选择在浏览器打开')
      return false
    }
    return true;
  },
  init() {
    return new Promise((resole, reject) => {
      !this.getout() && reject()
      if (mobile) {
        if (localStorage.from && localStorage.from != 'undefined' && localStorage.from != 'null') {
          dapp.from = localStorage.from;
          resole(localStorage.from)
        } else {
          loadingInstance = Loading({
            lock: true,
            text: '正在登录，请等待...',
            background: 'rgba(000,000,000,.75)'
          });
          let to = config.dappAddress;
          let func = "len";
          let para = JSON.stringify([]);
          let serialNumber = nebPay.call(to, 0, func, para);
          time = setInterval(() => {
            nebPay.queryPayInfo(serialNumber) //search transaction result from server (result upload to server by app)
              .then(function (res) {
                res = JSON.parse(res);
                if (res.code == 0) {
                  loadingInstance.close();
                  clearInterval(time)
                  time = null
                  dapp.from = res.data.from;
                  localStorage.from = dapp.from;
                  resole(res.data.from)
                }
              })
              .catch(function (err) {
                reject(err.message)
              });
          }, 3000)
        }
        return
      }
      window.postMessage({
          target: "contentscript",
          data: {},
          method: "getAccount"
        },
        "*"
      );
      window.addEventListener("message", e => {
        if (e.data && e.data.data) {
          if (e.data.data.account) {
            dapp.from = e.data.data.account;
            resole(e.data.data.account)
          }
        }
      });
    })
  },
  set(obj) {
    return new Promise((resole, reject) => {
      !this.getout() && reject()
      loadingInstance = Loading({
        lock: true,
        text: '正在上传，请等待...',
        background: 'rgba(000,000,000,.75)'
      });
      let to = config.dappAddress;
      let func = "set";
      let para = JSON.stringify([obj.id, obj]);
      let serialNumber = nebPay.call(to, 0, func, para);
      if (mobile) {
        time = setInterval(() => {
          nebPay.queryPayInfo(serialNumber) //search transaction result from server (result upload to server by app)
            .then(function (res) {
              res = JSON.parse(res);
              if (res.code == 0 && res.data.status == 1) {
                clearInterval(time)
                loadingInstance.close();
                time = null
                resole()
              }
            })
            .catch(function (err) {
              reject(err.message)
            });
        }, 3000)
        return
      }
      window.addEventListener("message", e => {
        if (e.data && e.data && e.data.resp && e.data.resp.txhash) {
          time = setInterval(() => {
            axios
              .post(`${config.mode}/v1/user/getTransactionReceipt`, {
                hash: e.data.resp.txhash
              })
              .then(d => {
                if (d.data.result.status == 1) {
                  loadingInstance.close();
                  clearInterval(time)
                  time = null
                  resole()
                }
              });
          }, 3000)
        }
        if (e.data && e.data.resp === "Error: Transaction rejected by user") {
          loadingInstance.close();
          clearInterval(time)
          time = null
          return
        }
      });
    })
  },
  forEach() {
    if (!this.getout()) return
    var value = "0";
    var nonce = "0"
    var arg = 'a'
    var gas_price = "1000000"
    var gas_limit = "2000000"
    var callFunction = "forEach";
    var callArgs = JSON.stringify([dapp.from, '10', '0']);
    var contract = {
      "function": callFunction,
      "args": callArgs
    }
    loadingInstance = Loading({
      lock: true,
      text: '正在加载，请等待...',
      background: 'rgba(000,000,000,.75)'
    });
    return new Promise((resole, reject) => {
      neb.api.call(from, config.dappAddress, value, nonce, gas_price, gas_limit, contract).then((res) => {
        loadingInstance.close();
        res = JSON.parse(res.result || []);
        resole(JSON.parse(res))
      }).catch((err) => {
        loadingInstance.close();
        reject(err)
      })
    })
  },
}