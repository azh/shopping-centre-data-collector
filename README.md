# Shopping Centre Data Collector
A thing I made over the course of a week to rip data from Google Maps and organize it the way I want.

Note: according to Google, you can only pull a maximum of 60 places from a place, although sometimes it appears to pull more. It usually bugs out after doing that though.
## How to use

1. Put your Google Maps API key where it says ```YOUR_API_KEY``` in maps.html
2. Get the coordinates in latitude and longitude of the place you want to collect data from as well as the radius you want to scan
3. Edit the variable ```MAP_CENTER``` in fetch.js. In Google Maps, you can find this information in the page URL.
4. Edit the variable ```CENTRES``` in handle.js as needed. One shopping centre is added as an example.
5. Open map.html and open the console. After you see ```all results loaded.``` and nothing else pops up after awhile, you're good to go.
6. Run ```prepareData()```. This will also pop up a download prompt allowing you to export your shopping centres and counts of shops fitting the included indicator functions (shop types) as a csv file.
7. If you want to export the places that Google Maps didn't categorize, run ```exportWeirdPlaces()```.
