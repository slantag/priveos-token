/**
  * privEOS Token Distribution:
  * 80% Delegation Pool
  * 10% Founders 
  * 10% Investors (Unallocated)
  *
  * Delegation Pool:
  * 80% Block Producers (Unallocated)
  * 20% DAC Service Company
  *
  * Founders:
  * 15% Michael
  * 15% Marcel
  * 10% Tassia
  * 10% Fabian
  * 10% Angelo
  * 30% Employee Pool
  * 10% Advisor Pool
  *
  * Advisor Pool:
  * 25% Kyle
  * 75% Unallocated
  *
  * Employee Pool:
  * 100% Unallocated
  */
const fs = require('fs')
const Eos = require('eosjs')
// const httpEndpoint = 'https://proxy.eosnode.tools'
// const chainId = 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
const httpEndpoint = "http://127.0.0.1:8888"
const chainId = "cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f"
const secret = fs.readFileSync('key.txt', {encoding: 'utf8'})
const keyProvider = [secret]

const eos = Eos({httpEndpoint, chainId, keyProvider})
  
const slantagwallet = 'slantagpurse'
const token_contract = 'priveostoken'
const priveos_contract = 'priveosrules'
const locked_until = (new Date("2021-01-01T00:00:00.000+01:00")).getTime()/1000

const accounts = {
  'michael': ['1bizauhilkat', 15],
  'marcel': ['familyv12345', 15],
  'tassia': ['singasong115', 10],
  'fabian': ['techradar123', 10],
  'angelo': ['angelooooool', 10],
  'kyle': ['earnedreward', 4],
}

const msig_accounts = [
  '1bizauhilkat',
  'familyv12345',
  'singasong115',
  'techradar123',
  'angelooooool',
]

actions = []

async function main() {
  create_token()
  
  // 1. Issue N tokens to the slant ag wallet
  issue(1000, slantagwallet)
  
  // 2. Transfer 800 tokens to the privEOS contract
  transfer(slantagwallet, priveos_contract, 800, "DAC Funds")
  
  // 3. Delegate 200 Tokens to the Service Company
  delegate(slantagwallet, 200)
  
  // 4. For each founder, transfer 50% of the amount to the founder's wallet
  //    the other 50% to the priveos placeholder contract, so they will be 
  //    locked in
  for(const [founder_name, [eos_account, amount]] of Object.entries(accounts)) {
    console.log(`${founder_name} with eos account name "${eos_account}" will get "${amount}"`)
    add_founder(eos_account, amount)
  }
  
  set_multisig()
  
  await execute_transaction()
}

function format_token(value) {
  return `${value.toFixed(4)} PRIVEOS`
}

function token_action(name, data) {
  return {
    account: token_contract,
    name: name,
    authorization: [{
      actor: token_contract,
      permission: 'active',
    }],
    data,
  }
}


function add_founder(name, tokens) {
  transfer(slantagwallet, name, tokens/2, 'Founder Shares')
  transfer(slantagwallet, priveos_contract, tokens/2, 'Founder Shares')
  lock(name, tokens/2)
}

function lock(user, quantity) {
  actions.push({
    account: priveos_contract,
    name: 'lock',
    authorization: [{
      actor: priveos_contract,
      permission: 'active',
    }],
    data: {
      user,
      quantity: format_token(quantity),
      locked_until,
    },
  })
}

function delegate(user, value) {
  actions.push({
    account: priveos_contract,
    name: 'delegate',
    authorization: [{
      actor: priveos_contract,
      permission: 'active',
    }],
    data: {
      user,
      value: format_token(value),
    },
  })
}


function transfer(from, to, amount, memo) {
  actions.push({
    account: token_contract,
    name: 'transfer',
    authorization: [{
      actor: from,
      permission: 'active',
    }], 
    data: {
      from,
      to, 
      quantity: format_token(amount),
      memo,
    },
  })
}

function create_token() {
  actions.push(token_action('create', {
    issuer: token_contract,
    maximum_supply: '1000.0000 PRIVEOS',
  }))
}

function issue(amount, to) {
  actions.push(token_action('issue', {
    to,
    quantity: format_token(amount),
    memo: "First issuance",
  }))
}

function updateauth(account, permission, auth) {
  actions.push({
    account: 'eosio',
    name: 'updateauth',
    authorization: [{
      actor: account,
      permission: permission,
    }],
    data: {
      account,
      permission,
      parent: permission=='active'? 'owner': '',
      auth,
    }
  })
}

function perm(name) {
  return {
    "permission": {
      "actor": name,
      "permission":"active",
    },
    "weight":1,
  }
}

function eosio_code(name) {
  return {
    "permission": {
      "actor": name,
      "permission":"eosio.code",
    },
    "weight":3,
  }
}

function get_auth(name, add_eosio_code) {
  let accounts = msig_accounts.map(x => perm(x))
  if(add_eosio_code) {
      accounts = accounts.concat(eosio_code(name))
  }
  return { 
    "threshold": 3, 
    "keys": [], 
    "accounts": accounts, 
    "waits": [] 
  }
}

function add_updateauth(name, permission, add_eosio_code=false) {
  updateauth(name, permission, get_auth(name, add_eosio_code))
}

function set_multisig() {
  add_updateauth(priveos_contract, "active", true)
  add_updateauth(priveos_contract, "owner")
  add_updateauth(token_contract, "active", true)
  add_updateauth(token_contract, "owner")
  add_updateauth(slantagwallet, "active")
  add_updateauth(slantagwallet, "owner")
}
async function execute_transaction() {
  const res = await eos.transaction({actions: actions})
  console.log(res)
}

main()
console.log(actions)