// Test script to check client controls data
const { db } = require('./db.ts');

async function testClientControls() {
    try {
        console.log('Testing client controls for clientId: 679');
        
        // Test getClientControls function
        const controls = await db.getClientControls(679);
        
        console.log(`Total controls found: ${controls.length}`);
        
        if (controls.length > 0) {
            console.log('\nSample controls (first 5):');
            controls.slice(0, 5).forEach((control, index) => {
                console.log(`\nControl ${index + 1}:`);
                console.log(`  Client Control ID: ${control.clientControl.id}`);
                console.log(`  Control ID: ${control.control?.controlId || 'N/A'}`);
                console.log(`  Name: ${control.control?.name || control.clientControl.customDescription}`);
                console.log(`  Framework: ${control.control?.framework || 'Custom'}`);
                console.log(`  Status: ${control.clientControl.status}`);
            });
            
            // Check for NIST frameworks
            const nistControls = controls.filter(c => 
                c.control?.framework?.includes('NIST') || 
                c.control?.framework?.includes('800-171') || 
                c.control?.framework?.includes('800-172')
            );
            
            console.log(`\nNIST controls found: ${nistControls.length}`);
            
            if (nistControls.length > 0) {
                console.log('\nNIST control samples:');
                nistControls.slice(0, 3).forEach((control, index) => {
                    console.log(`\nNIST Control ${index + 1}:`);
                    console.log(`  Control ID: ${control.control?.controlId}`);
                    console.log(`  Framework: ${control.control?.framework}`);
                    console.log(`  Name: ${control.control?.name}`);
                });
            }
        } else {
            console.log('No controls found for this client.');
        }
        
    } catch (error) {
        console.error('Error testing client controls:', error);
    }
}

// Run the test
testClientControls();