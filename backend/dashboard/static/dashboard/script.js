document.addEventListener('DOMContentLoaded', () => {
    // --- Smart Route Feature ---
    const smartRouteForm = document.getElementById('smart-route-form');
    const smartRouteResult = document.getElementById('smart-route-result');

    if (smartRouteForm) {
        smartRouteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            smartRouteResult.innerHTML = '<span class="text-blue-400 animate-pulse font-mono">> ESTABLISHING UPLINK... FETCHING ROUTE DATA</span>';
            const startId = document.getElementById('start-checkpoint').value;
            const endId = document.getElementById('end-checkpoint').value;

            try {
                const response = await fetch('/navigation/api/get-smart-route/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ start_checkpoint_id: startId, end_checkpoint_id: endId })
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                smartRouteResult.innerHTML = `<pre class="whitespace-pre-wrap text-xs text-green-400 font-mono text-left bg-black/50 p-4 rounded border border-green-500/30 w-full h-full overflow-auto">${JSON.stringify(data, null, 2)}</pre>`;
            } catch (error) {
                smartRouteResult.innerHTML = `<span class="text-red-500 font-mono">> ERROR: ${error.message}</span>`;
            }
        });
    }

    // --- Offline Data Feature ---
    const fetchOfflineDataBtn = document.getElementById('fetch-offline-data');
    const offlineDataResult = document.getElementById('offline-data-result');
    const syncLabel = document.getElementById('sync-count-display'); // Correct ID for new HTML

    if (fetchOfflineDataBtn) {
        fetchOfflineDataBtn.addEventListener('click', async () => {
            const icon = fetchOfflineDataBtn.querySelector('i');
            if(icon) icon.classList.add('fa-spin');
            if(offlineDataResult) {
                offlineDataResult.classList.remove('hidden');
                offlineDataResult.innerHTML = '> SYNCING OFFLINE DATABASE...';
            }

            try {
                const response = await fetch('/navigation/api/offline-data/');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                
                const now = new Date();
                if(syncLabel) syncLabel.innerText = "Synced: " + now.toLocaleTimeString('en-GB');
                if(offlineDataResult) {
                    offlineDataResult.innerHTML = `> SYNC COMPLETE. ${data.checkpoints.length} CPts, ${data.routes.length} Rts cached.`;
                    setTimeout(() => { offlineDataResult.classList.add('hidden'); if(icon) icon.classList.remove('fa-spin'); }, 3000);
                }
            } catch (error) {
                if(offlineDataResult) offlineDataResult.innerHTML = `> SYNC FAILED: ${error.message}`;
                if(icon) icon.classList.remove('fa-spin');
            }
        });
    }
});