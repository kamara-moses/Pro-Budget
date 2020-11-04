let db;
// create a new db request for a "budget" database.
const request = window.indexedDB.open("budget", 1);

request.onupgradeneeded = function(event) {
    // create object store called "pending" and set autoIncrement to true
    db = event.target.result;

    const pendingStore = db.createObjectStore("pending", {
        autoIncrement: true
    });

};

request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(request.errorCode);
};

// save transactions to indexed DB when offline
function saveRecord(record) {
    // create a transaction on the pending db with readwrite access
    // access the pending object store
    // add record to the store with add method.
    const transaction = db.transaction(["pending"], "readwrite");
    const pendingStore = transaction.objectStore("pending");
    console.log("Offline - Saving Transaction in IndexedDB");
    console.log(record);
    pendingStore.add(record);
}

function checkDatabase() {
    // open a transaction on the pending db
    // access the pending object store
    // get all records from store and set to a variable
    const transaction = db.transaction(["pending"], "readwrite");
    const pendingStore = transaction.objectStore("pending");

    const getAll = pendingStore.getAll();

    // post transations stored while offline to the database when online access is restured
    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                    method: 'POST',
                    body: JSON.stringify(getAll.result),
                    headers: {
                        Accept: 'application/json, text/plain, */*',
                        'Content-Type': 'application/json',
                    },
                })
                .then((response) => response.json())
                .then(() => {
                    // if successful, open a transaction on the pending db
                    // access the pending object store
                    // clear all items in the store
                    const transaction = db.transaction(["pending"], "readwrite");
                    const pendingStore = transaction.objectStore("pending");
                    console.log("Online - Post Transactions and Clear IndexedDB");
                    pendingStore.clear();

                });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);