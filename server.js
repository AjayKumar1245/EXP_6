// server.js

const http = require('http');
const fs = require('fs');
const path = require('path');

// Path to the JSON file (our "database")
const dataFilePath = path.join(__dirname, 'data.json');

// Helper function to read JSON data safely
const readDataFile = (callback) => {
  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    if (err) return callback(err, []);
    try {
      const parsedData = JSON.parse(data || '[]'); // Return empty array if file is empty
      callback(null, parsedData);
    } catch (parseErr) {
      callback(parseErr, []);
    }
  });
};

// Helper function to write JSON data safely
const writeDataFile = (data, callback) => {
  fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), callback);
};

// Create the HTTP server
const server = http.createServer((req, res) => {
  console.log(`Requested URL: ${req.url}, Method: ${req.method}`);

  // Serve the HTML page (for frontend interactions)
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
  }

  // Handle API routes for CRUD operations
  else if (req.url === '/api/data' && req.method === 'GET') {
    readDataFile((err, items) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'Error reading data' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(items));
    });
  }
  
  // Create (POST)
  else if (req.url === '/api/data' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      const newData = JSON.parse(body);
      readDataFile((err, items) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'Error reading data' }));
        }
        items.push(newData); // Add the new item
        writeDataFile(items, (writeErr) => {
          if (writeErr) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: 'Error saving data' }));
          }
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newData)); // Return the new item
        });
      });
    });
  }
  
  // Update (PUT)
  else if (req.url === '/api/data' && req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      const updatedData = JSON.parse(body);
      readDataFile((err, items) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'Error reading data' }));
        }
        const index = items.findIndex(item => item.id === updatedData.id);
        if (index === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'Item not found' }));
        }
        items[index] = updatedData; // Update the item
        writeDataFile(items, (writeErr) => {
          if (writeErr) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: 'Error saving data' }));
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(updatedData));
        });
      });
    });
  }
  
  else if (req.url === '/api/data' && req.method === 'DELETE') {
    let body = '';

    req.on('data', chunk => {
        body += chunk;
    });

    req.on('end', () => {
        const deleteData = JSON.parse(body);
        console.log("Delete request received for:", deleteData); // Debugging log

        fs.readFile(dataFilePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Error reading data' }));
                return;
            }
            
            let items;
            try {
                items = JSON.parse(data);
            } catch (parseError) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Data file is corrupted' }));
                return;
            }

            // Find the index of the item to delete
            const index = items.findIndex(item => String(item.id) === String(deleteData.id));
            console.log("Index to delete:", index); // Debugging log

            if (index !== -1) {
                // Remove the item from the array
                items.splice(index, 1); 

                // Reassign IDs sequentially from 1
                items = items.map((item, idx) => ({ ...item, id: idx + 1 }));

                // Save the updated array back to the JSON file
                fs.writeFile(dataFilePath, JSON.stringify(items, null, 2), (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Error saving data' }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Item deleted and IDs rearranged' }));
                    }
                });
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Item not found' }));
            }
        });
    });
}



  // If route is not found
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Define port and start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
