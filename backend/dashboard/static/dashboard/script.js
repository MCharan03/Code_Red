document.addEventListener('DOMContentLoaded', () => {

    // --- Smart Route Feature ---
    const smartRouteForm = document.getElementById('smart-route-form');
    const smartRouteResult = document.getElementById('smart-route-result');

    smartRouteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        smartRouteResult.innerHTML = '<span class="text-blue-700 animate-pulse">> ESTABLISHING UPLINK... FETCHING ROUTE DATA</span>';

        const startId = document.getElementById('start-checkpoint').value;
        const endId = document.getElementById('end-checkpoint').value;

        try {
            const response = await fetch('/navigation/api/get-smart-route/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start_checkpoint_id: startId,
                    end_checkpoint_id: endId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Format the output to look technical
            smartRouteResult.innerHTML = `<pre class="whitespace-pre-wrap text-xs">${JSON.stringify(data, null, 2)}</pre>`;

        } catch (error) {
            smartRouteResult.innerHTML = `<span class="text-red-600">> ERROR: ${error.message}</span>`;
        }
    });


    // --- Offline Data Feature (Mapped to the Refresh Icon) ---
    const fetchOfflineDataBtn = document.getElementById('fetch-offline-data');
    const offlineDataResult = document.getElementById('offline-data-result');
    const syncTimestamp = document.getElementById('sync-timestamp');

    fetchOfflineDataBtn.addEventListener('click', async () => {
        // Visual feedback on the button icon
        const icon = fetchOfflineDataBtn.querySelector('i');
        icon.classList.add('fa-spin');
        
        // Show the hidden debug box for a moment
        offlineDataResult.classList.remove('hidden');
        offlineDataResult.innerHTML = '> SYNCING OFFLINE DATABASE...';

        try {
            const response = await fetch('/navigation/api/offline-data/');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Update timestamp to current time
            const now = new Date();
            syncTimestamp.innerText = now.toLocaleTimeString('en-GB');

            offlineDataResult.innerHTML = `> SYNC COMPLETE. ${data.checkpoints.length} Checkpoints, ${data.routes.length} Routes cached.`;
            
            // Hide the debug box after 3 seconds to keep UI clean
            setTimeout(() => {
                offlineDataResult.classList.add('hidden');
                icon.classList.remove('fa-spin');
            }, 3000);

        } catch (error) {
            offlineDataResult.innerHTML = `> SYNC FAILED: ${error.message}`;
            icon.classList.remove('fa-spin');
        }
    });

});