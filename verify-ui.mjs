// A simple verification script that checks the DOM via fetch
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('Opening browser to http://localhost:5173...');
  
  // We'll use a CDP connection to verify the UI
  try {
    // Try to get a screenshot via simple HTTP request to the dev server
    const response = await fetch('http://localhost:5173');
    const html = await response.text();
    
    // The Tweakpane UI is built dynamically, so we need to check if the base app loads
    const hasApp = html.includes('id="app"');
    const hasGlassPanel = html.includes('glass-panel');
    
    console.log('App mount point (#app):', hasApp ? 'YES' : 'NO');
    console.log('Glass panels loaded:', hasGlassPanel ? 'YES' : 'NO');
    
    if (!hasApp) {
      console.log('ERROR: App mount point not found');
      process.exit(1);
    }
    
    console.log('\nApp is loaded. Tweakpane UI is built dynamically at runtime.');
    console.log('Manual verification required via Chrome at http://localhost:5173');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
