const Bot = require('./lib/Bot')
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')
const Client = require('coinbase').Client
let bot = new Bot()

// ROUTING

bot.onEvent = function(session, message) {
  switch (message.type) {
    case 'Init':
      welcome(session)
      break
    case 'Message':
      onMessage(session, message)
      break
    case 'Command':
      onCommand(session, message)
      break
    case 'Payment':
      onPayment(session, message)
      break
    case 'PaymentRequest':
        session.reply("Here is your Ether ;)");
        session.reply(SOFA.Message({
          body: "Here is your Ether",
          attachments: [{
            "type": "image",
            "url": "ethereum.jpg"
        }]
      })) 
      break
  }
}

function onMessage(session, message) {
  if(message.body.substring(0,9).toUpperCase() == 'API KEY: ') {
    setAPIKey(session, message)
  }
  else if(message.body.substring(0,12).toUpperCase() == 'SECRET KEY: ') {
    setSecretKey(session, message)
  } else {
    help(session)
  }
}

function onCommand(session, command) {
  switch (command.content.value) {
    case 'api':
      api(session)
      break
    case 'connect':
      connect(session)
      break
    case 'donate':
      donate(session)
      break
    case 'help':
      help(session)
      break
    case 'reset':
      reset(session)
      break
    }
}

function onPayment(session, message) {
  if (message.fromAddress == session.config.paymentAddress) {
    // handle payments sent by the bot
    if (message.status == 'confirmed') {
      // perform special action once the payment has been confirmed
      // on the network
    } else if (message.status == 'error') {
      // oops, something went wrong with a payment we tried to send!
    }
  } else {
    // handle payments sent to the bot
    if (message.status == 'unconfirmed') {
      // payment has been sent to the ethereum network, but is not yet confirmed
      sendMessage(session, `Thanks for the payment! 🙏`);
    } else if (message.status == 'confirmed') {
      // handle when the payment is actually confirmed!
    } else if (message.status == 'error') {
      sendMessage(session, `There was an error with your payment!🚫`);
    }
  }
}
// STATES

function welcome(session) {
  session.set('isFirstTimer', true)
  session.reply('Hello! I am the Turtled Bot.sendMessage(session, ')
}

function api(session) {
  session.reply('You need to get your API key from Coinbase at https://www.coinbase.com/settings/api')
  session.reply('I will need the ability to read all of your accounts in order to show you your balances.')
  session.reply('Please reply with "API Key: [your key]"')
}

function setAPIKey(session, message) {
   let apiKey = session.get('apiKey')
   apiKey = message.body.substring(9)
   session.set('apiKey',apiKey)
   session.reply('Your API Key is now: ' + session.get('apiKey'))
     if(!session.get('secretKey'))
       session.reply('Now you need to set your secret key')
}

function setSecretKey(session,message) {
  let secretKey = session.get('secretKey')
  secretKey = message.body.substring(12)
  session.set('secretKey',secretKey)
  session.reply('Your secret key is now: ' + session.get('secretKey'))
  if(!session.get('apiKey'))
    session.reply('Now you need to set your API key')
  else{
    let controls = [
      {type: 'button', label: 'Connect to Coinbase', value: 'connect'},
      {type: 'button', label: 'Reset', value: 'reset'}
    ]
    session.reply(SOFA.Message({
      body: 'Your API key and secret keys are now set',
      controls: controls,
      showKeyboard: false,
    }))
  }
}

function connect(session) {
  var client = new Client({'apiKey': session.get('apiKey'), 'apiSecret': session.get('secretKey')})
  client.getAccounts({}, function(err, accounts) {
    accounts.forEach(function(acct) {
      console.log('my bal: ' + acct.balance.amount + ' for ' + acct.name);
    });
  });
  session.set('coinbaseClient',client)
  session.reply("Coinbase connected!")
}

function donate(session) {
  // request $1 USD at current exchange rates
  Fiat.fetch().then((toEth) => {
    session.requestEth(toEth.USD(1))
  })
}

function help(session) {
  let isFirstTimer = (session.get('isFirstTimer'))
  let controls = [
      {type: 'button', label: 'Set up Coinbase', value: 'api'},
      {type: 'button', label: 'Reset', value: 'reset'},
      {type: 'button', label: 'Donate', value: 'donate'}
    ]
    if(isFirstTimer){ 
     session.reply("I am a simple bot designed to help you interact with your Coinbase account.")
     session.reply("In order to use me, you will need to submit your API key because I am too lazy to learn how to implement OAuth2.")
     session.reply("My creator doesn't have access to your API key or your Coinbase account, but you don't have to believe me or him. You can check my code!") 
     session.reply("While you are checking out the code, feel free to contribute to the project.")
     session.reply(SOFA.Message({
       body: "The source code can be found at https://github.com/cooperfle/toshi-app-js",
       controls: controls,
       showKeyboard: false,
     }))
     session.set('isFirstTimer',false)
    }else{
      session.reply(SOFA.Message({
        body: "I am a simple bot designed to help you interact with your Coinbase account.",
        controls: controls,
        showKeyboard: false,
      }))
    }
}

function reset(session) {
  //Clear set values
  session.reset()
}
// HELPERS

function sendMessage(session, message) {
  let controls = [
    {type: 'button', label: 'Reset', value: 'reset'},
    {type: 'button', label: 'Donate', value: 'donate'},
    {type: 'help', label: 'Help', value: 'help'}
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
 }
