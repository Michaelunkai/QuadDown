// Download Queue Service
// Manages a queue of downloads that start automatically, supporting unlimited parallel downloads

const QUEUE_STORAGE_KEY = "ascendDownloadQueue";

// Get the current download queue
export const getDownloadQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY) || "[]");
  } catch (error) {
    console.error("Error reading download queue:", error);
    return [];
  }
};

// Save the download queue
const saveDownloadQueue = queue => {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Error saving download queue:", error);
  }
};

// Add a download to the queue
export const addToQueue = downloadData => {
  const queue = getDownloadQueue();
  const queueItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    addedAt: Date.now(),
    ...downloadData,
  };
  queue.push(queueItem);
  saveDownloadQueue(queue);
  return queueItem;
};

// Remove a download from the queue by ID
export const removeFromQueue = id => {
  const queue = getDownloadQueue();
  const newQueue = queue.filter(item => item.id !== id);
  saveDownloadQueue(newQueue);
  return newQueue;
};

// Get the next download in the queue
export const getNextInQueue = () => {
  const queue = getDownloadQueue();
  return queue.length > 0 ? queue[0] : null;
};

// Clear the entire queue
export const clearQueue = () => {
  saveDownloadQueue([]);
};

// Reorder the queue by moving an item from one index to another
export const reorderQueue = (fromIndex, toIndex) => {
  const queue = getDownloadQueue();
  if (
    fromIndex < 0 ||
    fromIndex >= queue.length ||
    toIndex < 0 ||
    toIndex >= queue.length
  ) {
    return queue;
  }
  const newQueue = [...queue];
  const [movedItem] = newQueue.splice(fromIndex, 1);
  newQueue.splice(toIndex, 0, movedItem);
  saveDownloadQueue(newQueue);
  return newQueue;
};

// Count active downloads (only count games actively downloading, not extracting/verifying)
// Extraction runs in parallel and does not occupy a download slot
export const getActiveDownloadCount = async () => {
  try {
    const games = await window.electron.getGames();
    return games.filter(game => {
      const { downloadingData } = game;
      return (
        downloadingData &&
        (downloadingData.downloading || downloadingData.updating) &&
        !downloadingData.extracting &&
        !downloadingData.verifying
      );
    }).length;
  } catch (error) {
    console.error("Error counting active downloads:", error);
    return 0;
  }
};

// Check if there are active downloads — kept for backward compatibility
export const hasActiveDownloads = async () => {
  return (await getActiveDownloadCount()) > 0;
};

// Process the next item in the queue if a slot is available
// maxConcurrent defaults to 50 (effectively unlimited)
export const processNextInQueue = async (maxConcurrent = 50) => {
  const nextItem = getNextInQueue();
  if (!nextItem) {
    return null;
  }

  // Check if a slot is available
  const activeCount = await getActiveDownloadCount();
  if (activeCount >= maxConcurrent) {
    return null; // All slots occupied
  }

  // Start the download
  try {
    await window.electron.downloadFile(
      nextItem.url,
      nextItem.gameName,
      nextItem.online || false,
      nextItem.dlc || false,
      nextItem.isVr || false,
      nextItem.updateFlow || false,
      nextItem.version || "",
      nextItem.imgID || null,
      nextItem.size || "",
      nextItem.additionalDirIndex || 0,
      nextItem.gameID || ""
    );

    // Wait for the download to appear in the games list before removing from queue
    const waitForDownloadToAppear = async (maxAttempts = 10) => {
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const games = await window.electron.getGames();
        const found = games.some(
          g =>
            g.game === nextItem.gameName &&
            g.downloadingData &&
            (g.downloadingData.downloading || g.downloadingData.extracting)
        );
        if (found) {
          removeFromQueue(nextItem.id);
          return;
        }
      }
      // Fallback: remove anyway after max attempts
      removeFromQueue(nextItem.id);
    };

    waitForDownloadToAppear();

    return nextItem;
  } catch (error) {
    console.error("Error starting queued download:", error);
    // Remove from queue on error to prevent infinite retry
    removeFromQueue(nextItem.id);
    return null;
  }
};

// Fill all available download slots from the queue simultaneously
// Starts as many queued downloads as possible up to maxConcurrent
// maxConcurrent defaults to 50 (effectively unlimited)
export const fillDownloadSlots = async (maxConcurrent = 50) => {
  const activeCount = await getActiveDownloadCount();
  const slotsAvailable = Math.max(0, maxConcurrent - activeCount);
  const started = [];

  for (let i = 0; i < slotsAvailable; i++) {
    const queue = getDownloadQueue();
    if (queue.length === 0) break;

    // Pass maxConcurrent - started.length so each iteration sees updated count
    const next = await processNextInQueue(maxConcurrent - i);
    if (!next) break;
    started.push(next);
  }

  return started;
};
