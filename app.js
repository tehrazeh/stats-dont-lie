//import fetch from 'node-fetch';

// user inputs for player search
let searchName = '' // name input
let season = '' // season input

// variables to store player stats
let playerInfo // name + size + id + team, first search, no stats
let playerStatsResponse // stats based on id search
let playerStats = {} // object that stores found player's stats
let badges = [] // badges info for player

// links to retrieve the data
let searchPlayerUrl = "https://www.balldontlie.io/api/v1/players"
let searchStatsUrl

// HTML elements that will be changed depenging on the search result
let tag = document.getElementById('search_result')
let resultsBox = document.getElementById('resultsBox')
let badgesContainer = document.getElementById('earnedBadges')

// constants
const feetToCm = 30.48
const inchToCm = 2.54
const poundToKg = 0.453592

// hidden results box
resultsBox.style.visibility = "hidden"

// onclick event that runs every time user clicks search button
getSearchInputs = () => { 
    resultsBox.style.visibility = "hidden" 
    searchName = document.getElementById('inputName').value
    season = document.getElementById('inputSeason').value
    if (searchName == 0) { // case: no name provided 
        alert('Please specify the Name')
    } else if (season == 0) { // case: no season provided
        alert('Please specify the Season')
    } else { // both name and season provided
        getPlayer(searchName)
    }
    // refreshes the earned badges container for each new search
    badgesContainer.innerHTML = 
    `<label>Badges:</label>
    <h5 id="badgeChecker"></h5>`
}

// function that gets player info if the name is valid
async function getPlayer(name) {
    playerInfo = await fetch(searchPlayerUrl + `?search=${searchName}`).then((response) => response.json())

    if (playerInfo.data == 0) { // case: no player has been found with that name
        tag.innerHTML = `There is no player named ${name} that ever played in the NBA`  
    } else if (playerInfo.data.length > 1) { // case: more than one player with that name
        tag.innerHTML = `There is more than one player named ${name} that played in ${season} season!\nPlease, specify the name more.`
    } else if (season < 1981) { // case: season is too old, no data for that season in the database
        tag.innerHTML = `There is no data for seasons older than 1981`
    } else { // case: exactly one player found

        // populate player object with id, size, name and team
        playerStats.id = playerInfo.data[0].id      
        playerStats.name = playerInfo.data[0].first_name + " " + playerInfo.data[0].last_name
        playerStats.height_feet = playerInfo.data[0].height_feet + "'" + playerInfo.data[0].height_inches
        playerStats.height_cm = Math.round(playerInfo.data[0].height_feet * feetToCm  + playerInfo.data[0].height_inches * inchToCm)
        playerStats.weight_pounds = playerInfo.data[0].weight_pounds
        playerStats.weight_kilos = Math.round(playerInfo.data[0].weight_pounds * poundToKg)
        playerStats.team = playerInfo.data[0].team.name.toLowerCase()

        // with the player's id and season, find the stat averages
        searchStatsUrl = `https://www.balldontlie.io/api/v1/season_averages?season=${season}&player_ids[]=${playerStats.id}`
        getPlayerStats(searchStatsUrl)
    }
}

// function that gets the player's stats if he played in the provided season
async function getPlayerStats(url) {
    playerStatsResponse = await fetch(searchStatsUrl).then((response) => response.json())
        if (playerStatsResponse.data == 0) { // case: player did not play that season (injured / was not in the NBA)
            tag.innerHTML = `${playerStats.name} did not play in season ${season}`
        } else { // case: data successfully received
            resultsBox.style.visibility = "visible" // display the result box

            // populate player object with the season averages
            playerStats.pts = playerStatsResponse.data[0].pts
            playerStats.reb = playerStatsResponse.data[0].reb
            playerStats.ast = playerStatsResponse.data[0].ast
            playerStats.blk = playerStatsResponse.data[0].blk
            playerStats.stl = playerStatsResponse.data[0].stl
            playerStats.fg_pct = playerStatsResponse.data[0].fg_pct
            playerStats.fg3_pct = playerStatsResponse.data[0].fg3_pct
            playerStats.ft_pct = playerStatsResponse.data[0].ft_pct
            playerStats.games_played = playerStatsResponse.data[0].games_played
            playerStats.min = playerStatsResponse.data[0].min

            // functions that display stats, photos of player and team, and earned badges (if there are any)
            displayStats()
            displayProfile()
            displayPhotos()
            createBadges()
        }

    
}

// function that displays player's averages
displayStats = () => {
        tag.innerHTML = `Averages for ${playerStats.name} in season ${season}`
        document.getElementById('games_played').innerHTML = `Games Played: ${playerStats.games_played}`
        document.getElementById('minutes').innerHTML = `Minutes Averaged: ${playerStats.min}`
        document.getElementById('pts').innerHTML = `Points: ${playerStats.pts}`
        document.getElementById('reb').innerHTML = `Rebounds: ${playerStats.reb}`
        document.getElementById('ast').innerHTML = `Assists: ${playerStats.ast}`
        document.getElementById('stl').innerHTML = `Steals: ${playerStats.stl}`
        document.getElementById('blk').innerHTML = `Blocks: ${playerStats.blk}`
        document.getElementById('field_goals').innerHTML = `Field Goals %: ${playerStats.fg_pct}`
        document.getElementById('free_throws').innerHTML = `Free Throws %: ${playerStats.ft_pct}`
        document.getElementById('three_pointers').innerHTML = `3PT %: ${playerStats.fg3_pct}`
}

// function that displays player's name and size
displayProfile = () => {
    document.getElementById('name').innerHTML = `Name: ${playerStats.name}`
    if (playerStats.height_cm == 0) {
        document.getElementById('height').innerHTML = 'Height: No Data'
    } else {
        document.getElementById('height').innerHTML = `Height: ${playerStats.height_feet} (${playerStats.height_cm} cm)`
    }
    if (playerStats.weight_kilos == 0) {
        document.getElementById('weight').innerHTML = 'Weight: No Data'
    } else {
        document.getElementById('weight').innerHTML = `Weight: ${playerStats.weight_pounds} lbs (${playerStats.weight_kilos} kg)`
    }
}

// function that analyzes if player earned any badges.
createBadges = () => {

    // logical block of earned badge verification
    if (playerStats.pts >= 25) {
        badges.push('scorer')
    }
    if (playerStats.reb >= 10) {
        badges.push('rebounder')
    }
    if (playerStats.ast >= 8) {
        badges.push('passer')
    }
    if (playerStats.blk >= 1.5) {
        badges.push('rimprotector')
    }
    if (playerStats.stl >= 1.5) {
        badges.push('stealer')
    }
    if (playerStats.fg3_pct >= 0.4) {
        badges.push('sharpshooter')
    }

    // block that checks if player earned any badges
    if (badges.length > 0) { // case: one or more badges earned
        displayBadges() // displays earned badges
        badges = [] // refreshes the badges array from previous search result
    } else { // case: no badges earned, displays the appropriate message
        document.getElementById('badgeChecker').innerHTML = `${playerStats.name} did not earn <br> any badges in ${season} season`
    }
    
}

// function that displays player's badges for the season. Runs only if player has 1+ badges.
displayBadges = () => {
    badges.forEach(badge => {
        badgesContainer.innerHTML += 
        `<div class="badgeContainer">
            <img class="badge" src="images/badges/${badge}.png">
        </div>`
    })
}

// function that displays images of player and team
displayPhotos = () => {
 
    // display image of the team
    document.getElementById('teamContainer').innerHTML = `
        <label>Current (Last) Team:</label>
        <img class="teamImage" src="images/teams/${playerStats.team}.png">`

    // display image of the player

    document.getElementById('playerPhoto').innerHTML = 
        `<label>Player:</label>
        <img class="playerImage" 
        alt="There is no photo for ${playerStats.name}. 
        Photos only for:
        Lebron James, Michael Jordan, Kobe Bryant, Tim Duncan, Stephen Curry, 
        Kevin Durant, Kawhi Leonard"
        src="images/players/${playerStats.name.split(' ').join('').toLowerCase()}.png">`
}

