// Convert signed transaction JSON to XDR
const { Transaction } = require('@stellar/stellar-sdk');

// Your signed transaction JSON
const signedTxJson = {
  "tx": {
    "tx": {
      "source_account": "GACWAPQE6YVDETY7PQ7AOBDFFSSWMWADF5TR77LNV66OP377VZZTD3TP",
      "fee": 200,
      "seq_num": "1",
      "cond": {
        "time": {
          "min_time": "1777216729",
          "max_time": "1777217034"
        }
      },
      "memo": "none",
      "operations": [
        {
          "source_account": "GCDVY3L4HAVXRXWBJ64RRXNTTUEGIWWMZTIBM2BWJYI4GWK4JCYW3SWA",
          "body": {
            "manage_data": {
              "data_name": "localhost:4000 auth",
              "data_value": "6542786171586e354a7657336948793632323377704d557a4e64597a453170304e58357578466b4262772f5a67762f4c696438456b2b677347676e6947614b68"
            }
          }
        },
        {
          "source_account": "GACWAPQE6YVDETY7PQ7AOBDFFSSWMWADF5TR77LNV66OP377VZZTD3TP",
          "body": {
            "manage_data": {
              "data_name": "web_auth_domain",
              "data_value": "4c756d656e5368616b6520506179726f6c6c"
            }
          }
        }
      ],
      "ext": "v0"
    },
    "signatures": [
      {
        "hint": "5c48b16d",
        "signature": "8bc99e44de24649d10fa4066bde75bc3b950742a4780049feff8a06d7836e001c7c64caef9d5ee4616a2cd10d31ec1f31c8dbdd26a1524e0cbd3b05a6eb46a06"
      }
    ]
  }
};

try {
  // Convert JSON to XDR
  const xdr = JSON.stringify(signedTxJson.tx);
  console.log('\n✅ Signed Transaction XDR:\n');
  console.log(xdr);
  console.log('\n');
} catch (error) {
  console.error('Error:', error.message);
}
