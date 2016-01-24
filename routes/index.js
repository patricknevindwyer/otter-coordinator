var express = require('express');
var router = express.Router();
var request = require("request");
var _ = require("underscore");
var async = require("async");

// controller structures for 
var RESOLVE_QUEUE = [];
var SERVICE_CATALOG = {
    "networkDNS": "http://localhost:5000",
    "cachedDNS": "http://localhost:6000",
    "googleDNS": "http://localhost:7000",
    "openNICDNS": "http://localhost:9000"    
};

// Run loop for dispatching the queued resolve actions
// to all of the resolvers
function dispatchResolve(resolveData, next) {
    
    console.log("Beginning service dispatch");
    // loop through all of the SERVICE_CATALOG items
    async.each(
        _.pairs(SERVICE_CATALOG),
        
        // function to dispatch each of the services
        function (service, callback) {
            console.log("Dispatching to [%s] at [%s]", service[0], service[1]);
            request.post(
                {
                    url: service[1] + "/resolve",
                    json: true,
                    body: resolveData      
                },
                function (error, response, body) {
                    if (error) {
                        console.log("Error dispatching to [%s]\n\t%s", service[0], error);
                    }
                    callback();
                }
            );
        },
        
        // final callback
        function (error) {
            
            console.log("Finishing service dispatch.");
            
            if (error) {
                console.log("There was an error during service dispatch\n\t%s", error);
            }
            next();
        }
    )
}

function checkDispatch() {
    
    if (RESOLVE_QUEUE.length > 0) {
        console.log("Shifting item for dispatch");
        var nextResolve = RESOLVE_QUEUE.shift();
        dispatchResolve(nextResolve,
            function () {
                setTimeout(checkDispatch, 1000);
            }
        )
    }
    else {
        setTimeout(checkDispatch, 1000);
    }
}
checkDispatch();

router.post('/resolve', function (req, res, next) {
    var resolveObj = req.body;
    console.log("Received JSON blob for resolution dispatch\n\tuuid: %s", resolveObj.uuid);
    
    RESOLVE_QUEUE.push(resolveObj);
    
    res.json({error: false, msg: "ok"}); 
})


module.exports = router;
