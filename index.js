if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    try {
        // ask user for permission
        ethereum.enable();
        // user approved permission
    } catch (error) {
        // user rejected permission
        console.log('user rejected permission');
    }
  }
  else if (window.web3) {
    window.web3 = new Web3('http://localhost:7545');
    // no need to ask for permission
  }
  else {
    window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
  }
  console.log (window.web3);
  
  // contractAddress and abi are setted after contract deploy
  var contractAddress = '0xd9145CCE52D386f254917e481eB44e9943F39138';
  var abi = JSON.parse('[{"constant":false,"inputs":[{"internalType":"uint256","name":"_centerId","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"sendPPE","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_centerId","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"sendToAuthor","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_centerId","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"sendToDivision","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_centerId","type":"uint256"},{"internalType":"address","name":"yourAddress","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"distributors","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getInfo","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getInfo2","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"update","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"amount","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"senders","type":"address"}],"name":"yourBonus","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]')

  //contract instance
  contract = new web3.eth.Contract(abi, contractAddress);
  
  // Accounts
  var account;
  
  web3.eth.getAccounts(function(err, accounts) {
    if (err != null) {
      alert("Error retrieving accounts.");
      return;
    }
    if (accounts.length == 0) {
      alert("No account found! Make sure the Ethereum client is configured properly.");
      return;
    }
    account = accounts[0];
    console.log('Account: ' + account);
    web3.eth.defaultAccount = account;
  });
  
  web3.eth.getCoinbase(function(err, account){
      if(err === null){
          $('#accountAddress').html("Your login Account: "+ account);
      }
  });
  

    //display centers update    
    contract.methods.getInfo(1).call().then(function(view){

        var id = view[0];
        var name = view[1];
        var ppeCount = view[2];
        
        var template = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + ppeCount + "</td></tr>"
        //document.getElementById('distributionResult').innerHTML = template;
        document.getElementById('distributionResults').innerHTML = template;
          
        var centerOption = "<option value ='" + id + "' >"+ name + "</option>"
        document.getElementById('centerSelects').innerHTML = centerOption;
    });
      
      //sending ppe 

  function sendTransactions(){
      var centerId = $('#centerSelects').val();

      var ppeAmount = $('#amountSelects').val();
      var name = $('#distributionResults').val();
      
      contract.methods.sendPPE(centerId,ppeAmount).send( {from: account} ).then(function(tx){
         contract.methods.getInfo(1).call().then(function(view){
             var id = view[0];
             var name = view[1];
             var ppeCount = view[2];
             console.log("Transaction: ",tx);

             location.reload();

         });
     });
     
  }

  
  //distributor bonus result
  function getBonus(){
	  contract.methods.yourBonus(account).call().then(function(bonus){
	  console.log(bonus);
	  document.getElementById('lastInfo').innerHTML = bonus;
	});
  }

