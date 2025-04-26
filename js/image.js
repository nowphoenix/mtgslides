let cache = {};

const format = "large";

function loadCache() {
	try {
		const s = localStorage.getItem("img" + format);
		if (s) {
			cache = JSON.parse(s);
		}
	} catch (e) {
		console.warn("Couldn't initialize cache.", e.name);
	}
}

function saveCache() {
	try {
		localStorage.setItem("img" + format, JSON.stringify(cache));
	} catch (e) {
		console.warn("Couldn't save cache.", e.name);
	}
}

async function imageUrl(cardName, set = null, collectorNumber = null, excludeReprints = false) {
    // Create a unique cache key based on cardName, set, and collectorNumber
    const cacheKey = `${cardName}|${set || ""}|${collectorNumber || ""}`;
    let url = cache[cacheKey];
    if (url) {
        console.warn(`${cardName} found in cache with key: ${cacheKey}`);
        return url;
    }

    console.warn(`${cardName} not in cache, fetching from Scryfall.`);

    // Build the Scryfall API query
    let query = `!"${cardName}"`;
    if (excludeReprints) query += `++not:reprint`; // Add 'not:reprint' only if excludeReprints is true
    if (set) query += `++e:${set}`; // Use 'e:' for set
    if (collectorNumber) query += `++cn:${collectorNumber}`; // Use 'cn:' for collector number

    const uri = "https://api.scryfall.com/cards/search?q=" + encodeURIComponent(query);
    console.log("Scryfall Query URI:", uri); // Debugging: Log the query URI

    const json = await fetch(uri).then((res) => res.json());
    console.log("Scryfall Response for", cardName, ":", json); // Log the full response for debugging

    if (!json || !json.data || json.data.length === 0) {
        console.warn(`Could not find image for card "${cardName}"`);
        return null;
    }

    // Find the exact match for set and collector number
    const cardData = json.data.find(card => {
        const matchesSet = !set || card.set.toLowerCase() === set.toLowerCase();
        const matchesCollectorNumber = !collectorNumber || card.collector_number === collectorNumber.toString();
        return matchesSet && matchesCollectorNumber;
    });

    if (!cardData) {
        console.warn(`Could not find exact match for card "${cardName}" in set "${set}" with collector number "${collectorNumber}".`);
        console.log("Available cards in response:", json.data); // Log available cards for debugging
        return null;
    }

    url = cardData.image_uris[format];
    cache[cacheKey] = url; // Save the URL in the cache with the unique key
    saveCache(); // Save the updated cache to localStorage
    return url;
}
