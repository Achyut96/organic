const express = require('express')
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs')
require("dotenv").config();
var mysql = require("mysql");
var router = express.Router()
// var database = require('./database');
router.use(bodyParser.json());

// Setting for Hyperledger Fabric
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const gateway = new Gateway();

router.use(bodyParser.urlencoded({
    extended: false
}));
  
// CORS Origin
router.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
  });

// Login User
router.post("/login", function (req, res) {
  var empID = req.body.empID;
  var password = req.body.password;

  if (empID && password) {
    var con = mysql.createConnection({
      host: process.env.DATABASE_HOST,
      database: process.env.DATABASE_DATABASE,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD
    });
    con.connect(function (err) {
      if (err) {
        console.log(err);
      }
      query = `SELECT * FROM internlogin WHERE empID = "${empID}"`;
      con.query(query, function (err, data) {
        if (err) {
          console.log(err);
        }
        if (data.length > 0) {
          for (var count = 0; count < data.length; count++) {
            if (bcrypt.compareSync(password,data[count].password)) {
              req.session.empID = data[count].empID;
              con.end();
              res.redirect("/route/dashboard");
            } else {
              res.render('failurepage',{message:"Incorrect Password...!!"})
              con.end();
            }
          }
        } else {
          res.render('failurepage',{message:"Incorrect ID...!!"})
          con.end();
        }
      });
    });
   
  } else {
    res.render('failurepage',{message:"Please Enter ID and Password Details...!!"})
  
  }
});


//Route for Dashboard after Login
router.get('/dashboard', (req, res) => {
    if (req.session.empID) {
        res.render('dashboard',{user:req.session.empID})
    } else {
      res.render('failurepage',{message:"Unauthorized User...!!"})
    }
})

//Route for addfarmer after Login
router.get('/addfarmer', (req, res) => {
    if (req.session.empID) {
        res.render('addfarmer',{user:req.session.empID})
    } else {
      res.render('failurepage',{message:"Unauthorized User...!!"})
    }
})
//Route for queryfarmer after Login
router.get('/queryfarmer', (req, res) => {
    if (req.session.empID) {
        res.render('queryfarmer',{user:req.session.empID})
    } else {
      res.render('failurepage',{message:"Unauthorized User...!!"})
    }
})
//Route for addcrop after Login
router.get('/addcrop', (req, res) => {
    if (req.session.empID) {
        res.render('addcrop',{user:req.session.empID})
    } else {
      res.render('failurepage',{message:"Unauthorized User...!!"})
    }
})
//Route for querycrop after Login
router.get('/querycrop', (req, res) => {
    if (req.session.empID) {
        res.render('querycrop',{user:req.session.empID})
    } else {
      res.render('failurepage',{message:"Unauthorized User...!!"})
    }
})
//Route for gethistorypage after Login
router.get('/gethistorypage', (req, res) => {
    if (req.session.empID) {
        res.render('gethistorypage',{user:req.session.empID})
    } else {
      res.render('failurepage',{message:"Unauthorized User...!!"})
    }
})

//Route for Logout
router.get('/logout', (req, res) => {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err)
            res.send('Error')
        } else {
            res.render('base',{title:'Express',logout:'Logout Successful..!!'})
      }
  })
})

router.post('/api/addTuna', async function (req, res) {
  if (req.session.empID) {

    try {
      //const contract = await fabricNetwork.connectNetwork('connection-producer.json', 'wallet/wallet-producer');
      const ccpPath = path.resolve(__dirname, '.', 'connections', 'connection-producer.yaml');
      let connectionProfile = yaml.load(fs.readFileSync(ccpPath, 'utf8'));

      const walletPath = path.join(process.cwd(), 'identity/user/producer-user/wallet');
      const wallet = await Wallets.newFileSystemWallet(walletPath);
      console.log(`Wallet path: ${walletPath}`);

      const userName = 'producer-user';

      // Check to see if we've already enrolled the user.
      const identity = await wallet.get(userName);
      if (!identity) {
        console.log(`An identity for the user ${userName} does not exist in the wallet`);
        console.log('Run the addWallet.js application before retrying');
        return;
      }

      // Set connection options; identity and wallet
      let connectionOptions = {
        identity: userName,
        wallet: wallet,
        discovery: { enabled: true, asLocalhost: true }
      };

      // Connect to gateway using application specified parameters
      console.log('Connect to Fabric gateway.');
            

      await gateway.connect(connectionProfile, connectionOptions);

      console.log('Use network channel: mychannel.');

      const network = await gateway.getNetwork('mychannel');

      const contract = await network.getContract('scm-contract');


      let tuna = {
        Details: 'Farmer',
        id: req.body.id,
        Name: req.body.name,
        Father_Name: req.body.fathername,
        Date_of_Birth: req.body.dob,
        Country_code: req.body.countrycode,
        Phone: req.body.phonenum,
        Aadhar_Number: req.body.aadharnum,
        PAN_Number: req.body.pannum,
        Residential_Address: req.body.residentialaddress,
        Email: req.body.email,
        Village: req.body.Village,
        Tehsil: req.body.tehsil,
        District: req.body.district,
        State: req.body.state,
        Country: req.body.country,
        Pincode: req.body.pin
      }

      let tx = await contract.submitTransaction('addAsset', JSON.stringify(tuna));
     
      res.render('successpage',{message:"Transaction Submitted..!!", Transaction_ID: "Transaction ID: "+tx.toString()})
      console.log("Tuna Added Successfully");
    } catch (error) {
      console.error(`Failed to evaluate transaction: ${error}`);
      res.status(500).json({
        error: error
      });
    }
    finally {

      // Disconnect from the gateway
      console.log('Disconnect from Fabric gateway.');
      gateway.disconnect();
    
    }
  }else {
    res.render('failurepage',{message:"Unauthorized User...!!"})
}
  });

  router.post('/api/setPosition', async function (req, res) {
    if (req.session.empID) {
      try {
      
        const ccpPath = path.resolve(__dirname, '.', 'connections', 'connection-deliverer.yaml');
        let connectionProfile = yaml.load(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'identity/user/deliverer-user/wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const userName = 'deliverer-user';

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(userName);
        if (!identity) {
          console.log(`An identity for the user ${userName} does not exist in the wallet`);
          console.log('Run the addWallet.js application before retrying');
          return;
        }

        // Set connection options; identity and wallet
        let connectionOptions = {
          identity: userName,
          wallet: wallet,
          discovery: { enabled: true, asLocalhost: true }
        };

        // Connect to gateway using application specified parameters
        console.log('Connect to Fabric gateway.');
        

        await gateway.connect(connectionProfile, connectionOptions);

        console.log('Use network channel: mychannel.');

        const network = await gateway.getNetwork('mychannel');

        const contract = await network.getContract('scm-contract');



        let tx = await contract.submitTransaction('setPosition', req.body.id.toString(), req.body.latitude.toString(), req.body.longitude.toString());
        res.json({
          status: 'OK - Transaction has been submitted',
          txid: tx.toString()
        });
        console.log("Position of product updated");
      } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({
          error: error
        });
      }
      finally {

        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        gateway.disconnect();

      }
    }else {
      res.render('failurepage',{message:"Unauthorized User...!!"})
  }
  });
  
router.post('/api/getTuna', async function (req, res) {
  if (req.session.empID) {
    try {
      const ccpPath = path.resolve(__dirname, '.', 'connections', 'connection-manufacturer.yaml');
      let connectionProfile = yaml.load(fs.readFileSync(ccpPath, 'utf8'));

      const walletPath = path.join(process.cwd(), 'identity/user/manufacturer-user/wallet');
      const wallet = await Wallets.newFileSystemWallet(walletPath);
      console.log(`Wallet path: ${walletPath}`);

      const userName = 'manufacturer-user';

      // Check to see if we've already enrolled the user.
      const identity = await wallet.get(userName);
      if (!identity) {
        console.log(`An identity for the user ${userName} does not exist in the wallet`);
        console.log('Run the addWallet.js application before retrying');
        return;
      }

      // Set connection options; identity and wallet
      let connectionOptions = {
        identity: userName,
        wallet: wallet,
        discovery: { enabled: true, asLocalhost: true }
      };

      // Connect to gateway using application specified parameters
      console.log('Connect to Fabric gateway.');
        

      await gateway.connect(connectionProfile, connectionOptions);

      console.log('Use network channel: mychannel.');

      const network = await gateway.getNetwork('mychannel');

      const contract = await network.getContract('scm-contract');

      const result = await contract.evaluateTransaction('queryAsset', req.body.id);
      let response = JSON.parse(result.toString());
      console.log(result.toString());
      //set the appropriate HTTP header
      res.setHeader('Content-Type', 'text/html');
      res.write(`<style type="text/css">
     table {
      font-family: arial, sans-serif;
      border-collapse: collapse;
      width: 100%;
    }
    
    td, th {
      border: 1px solid #dddddd;
      text-align: left;
      padding: 8px;
    }
    
    tr:nth-child(even) {
      background-color: #dddddd;
    }
    h2{
      text-align: center;
       color:green
    }
    h3{
      text-align: center;
      color:green
    }
    #companyLogo{
        width: 50%;
        }
</style>`);
      res.write('<a href="/route/dashboard"><img src="/assets/logoFedTrust.jpg" alt="" id="companyLogo"></a><br><h2>Track Supply Chain</h2>');
      // Define recursive function to print nested values
      printValues(response);
  
      function printValues(response) {
    
        res.write('<table>');
        //send multiple responses to the client

        for (var k in response) {

          // res.write("<tr>")
          if (response[k] instanceof Object) {
            printValues(response[k]);
          } else {
            if (k == 'Details') {
              res.write('<tr><td colspan="2"><h3>' + response[k] + '</h3></td></tr>');

            }
            res.write('<tr><th>' + k + '</th><td>' + response[k] + '</td></tr>');
          };

          // res.write("</tr>")
        }
        res.write('</table>')
      };
      //end the response process
      res.end();
      
    } catch (error) {
      console.error(`Failed to evaluate transaction: ${error}`);
      res.status(500).json({
        error: error
      });
    }
    finally {

      // Disconnect from the gateway
      console.log('Disconnect from Fabric gateway.');
      gateway.disconnect();

    }
  }else {
    res.render('failurepage',{message:"Unauthorized User...!!"})
}
  })

router.post('/api/addSushi', async function (req, res) {
  if (req.session.empID) {
    try {
      const ccpPath = path.resolve(__dirname, '.', 'connections', 'connection-manufacturer.yaml');
      let connectionProfile = yaml.load(fs.readFileSync(ccpPath, 'utf8'));

      const walletPath = path.join(process.cwd(), 'identity/user/manufacturer-user/wallet');
      const wallet = await Wallets.newFileSystemWallet(walletPath);
      console.log(`Wallet path: ${walletPath}`);

      const userName = 'manufacturer-user';

      // Check to see if we've already enrolled the user.
      const identity = await wallet.get(userName);
      if (!identity) {
        console.log(`An identity for the user ${userName} does not exist in the wallet`);
        console.log('Run the addWallet.js application before retrying');
        return;
      }

      // Set connection options; identity and wallet
      let connectionOptions = {
        identity: userName,
        wallet: wallet,
        discovery: { enabled: true, asLocalhost: true }
      };

      // Connect to gateway using application specified parameters
      console.log('Connect to Fabric gateway.');
        

      await gateway.connect(connectionProfile, connectionOptions);

      console.log('Use network channel: mychannel.');

      const network = await gateway.getNetwork('mychannel');

      const contract = await network.getContract('scm-contract');


      let sushi = {
        Details: 'Land & Crop',
        id: req.body.id,
        Field_Co_ordinates: req.body.fieldlocation,
        Halka_Number: req.body.halkanumber,
        Khasra_Number: req.body.khasranumber,
        Hissa_Number: req.body.hissanumber,
        Land_Name: req.body.landname,
        Area: req.body.area,
        Area_unit: req.body.areaunit,
        Land_Type: req.body.landtype,
        Irrigation_Type: req.body.irrigationtype,
        Practice_Type: req.body.practicetype,
        Previous_Crop: req.body.previouscrop,
        Current_Crop: req.body.currentcrop,
        Soil_Type: req.body.soiltype,
        Crop_Season: req.body.season,
        Date_of_Record: req.body.dor
      }
      let tx = await contract.submitTransaction('addAsset', JSON.stringify(sushi));
      res.render('successpage',{message:"Transaction Submitted..!!", Transaction_ID: "Transaction ID: "+tx.toString()})
    } catch (error) {
      console.error(`Failed to evaluate transaction: ${error}`);
      res.status(500).json({
        error: error
      });
    }
    finally {

      // Disconnect from the gateway
      console.log('Disconnect from Fabric gateway.');
      gateway.disconnect();

    }
  }else {
    res.render('failurepage',{message:"Unauthorized User...!!"})
}
  
  })
  
router.post('/api/getSushi', async function (req, res) {
  if (req.session.empID) {
    try {
      const ccpPath = path.resolve(__dirname, '.', 'connections', 'connection-retailer.yaml');
      let connectionProfile = yaml.load(fs.readFileSync(ccpPath, 'utf8'));

      const walletPath = path.join(process.cwd(), 'identity/user/retailer-user/wallet');
      const wallet = await Wallets.newFileSystemWallet(walletPath);
      console.log(`Wallet path: ${walletPath}`);

      const userName = 'retailer-user';

      // Check to see if we've already enrolled the user.
      const identity = await wallet.get(userName);
      if (!identity) {
        console.log(`An identity for the user ${userName} does not exist in the wallet`);
        console.log('Run the addWallet.js application before retrying');
        return;
      }

      // Set connection options; identity and wallet
      let connectionOptions = {
        identity: userName,
        wallet: wallet,
        discovery: { enabled: true, asLocalhost: true }
      };

      // Connect to gateway using application specified parameters
      console.log('Connect to Fabric gateway.');
        

      await gateway.connect(connectionProfile, connectionOptions);

      console.log('Use network channel: mychannel.');

      const network = await gateway.getNetwork('mychannel');

      const contract = await network.getContract('scm-contract');

      const result = await contract.evaluateTransaction('queryAsset', req.body.id);
      let response = JSON.parse(result.toString());
      //res.json(response);
      console.log(result.toString());
      // res.render('SushiDetails');
      //set the appropriate HTTP header
      res.setHeader('Content-Type', 'text/html');
      res.write(`<style type="text/css">
 table {
  font-family: arial, sans-serif;
  border-collapse: collapse;
  width: 100%;
}

td, th {
  border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;
}

tr:nth-child(even) {
  background-color: #dddddd;
}
h2{
  text-align: center;
   color:green
}
h3{
  text-align: center;
  color:green
}
#companyLogo{
    width: 50%;
    }
</style>`);
      res.write('<a href="/route/dashboard"><img src="/assets/logoFedTrust.jpg" alt="" id="companyLogo"></a><br><h2>Track Supply Chain</h2>');
      // Define recursive function to print nested values
      printValues(response);

      function printValues(response) {

        res.write('<table>');
        //send multiple responses to the client

        for (var k in response) {

          // res.write("<tr>")
          if (response[k] instanceof Object) {
            printValues(response[k]);
          } else {
            if (k == 'Details') {
              res.write('<tr><td colspan="2"><h3>' + response[k] + '</h3></td></tr>');

            }
            res.write('<tr><th>' + k + '</th><td>' + response[k] + '</td></tr>');
          };

          // res.write("</tr>")
        }
        res.write('</table>')
      };
      //end the response process
      res.end();
     
    } catch (error) {
      console.error(`Failed to evaluate transaction: ${error}`);
      res.status(500).json({
        error: error
      });
    }
    finally {

      // Disconnect from the gateway
      console.log('Disconnect from Fabric gateway.');
      gateway.disconnect();

    }
  }else {
    res.render('failurepage',{message:"Unauthorized User...!!"})
}
  })

router.post('/api/gethistory', async function (req, res) {
  if (req.session.empID) {
    try {
      const ccpPath = path.resolve(__dirname, '.', 'connections', 'connection-retailer.yaml');
      let connectionProfile = yaml.load(fs.readFileSync(ccpPath, 'utf8'));

      const walletPath = path.join(process.cwd(), 'identity/user/retailer-user/wallet');
      const wallet = await Wallets.newFileSystemWallet(walletPath);
      console.log(`Wallet path: ${walletPath}`);

      const userName = 'retailer-user';

      // Check to see if we've already enrolled the user.
      const identity = await wallet.get(userName);
      if (!identity) {
        console.log(`An identity for the user ${userName} does not exist in the wallet`);
        console.log('Run the addWallet.js application before retrying');
        return;
      }

      // Set connection options; identity and wallet
      let connectionOptions = {
        identity: userName,
        wallet: wallet,
        discovery: { enabled: true, asLocalhost: true }
      };

      // Connect to gateway using application specified parameters
      console.log('Connect to Fabric gateway.');
        

      await gateway.connect(connectionProfile, connectionOptions);

      console.log('Use network channel: mychannel.');

      const network = await gateway.getNetwork('mychannel');

      const contract = await network.getContract('scm-contract');

      const result = await contract.evaluateTransaction('getHistory', req.body.id);
      let response = JSON.parse(result.toString());
      //res.json(response);
      console.log(result.toString());
      // res.render('SushiDetails');
      //set the appropriate HTTP header
      res.setHeader('Content-Type', 'text/html');
      res.write(`<style type="text/css">
       table {
        font-family: arial, sans-serif;
        border-collapse: collapse;
        width: 100%;
      }
      
      td, th {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;
      }
      
      tr:nth-child(even) {
        background-color: #dddddd;
      }
      h2{
        text-align: center;
         color:green
      }
      h3{
        text-align: center;
        color:green
      }
      #companyLogo{
        width: 50%;
        }
  </style>`);
      res.write('<a href="/route/dashboard"><img src="/assets/logoFedTrust.jpg" alt="" id="companyLogo"></a><br><h2>Track Supply Chain</h2>');
      // Define recursive function to print nested values
      printValues(response);
    
      function printValues(response) {
      
        res.write('<table>');
        //send multiple responses to the client

        for (var k in response) {

          // res.write("<tr>")
          if (response[k] instanceof Object) {
            printValues(response[k]);
          } else {
            if (k == 'Details') {
              res.write('<tr><td colspan="2"><h3>' + response[k] + '</h3></td></tr>');

            }
            res.write('<tr><th>' + k + '</th><td>' + response[k] + '</td></tr>');
          };

          // res.write("</tr>")
        }
        res.write('</table>')
      };
      //end the response process
      res.end();
     
    } catch (error) {
      console.error(`Failed to evaluate transaction: ${error}`);
      res.status(500).json({
        error: error
      });
    }
    finally {

      // Disconnect from the gateway
      console.log('Disconnect from Fabric gateway.');
      gateway.disconnect();

    }
  }else {
    res.render('failurepage',{message:"Unauthorized User...!!"})
}
  })

module.exports = router