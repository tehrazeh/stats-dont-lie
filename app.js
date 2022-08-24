//import fetch from 'node-fetch';

// user inputs for player search
let searchName = '' // name input
let season = '' // season input

// variables to store player stats
let playerInfo // name + size + id + team, first search, no stats
let playerStatsResponse // stats based on id search
let player_profile = {} // object with player's info wihtout stats
let player_stats = {} // object that stores found player's stats
let playerStats = {} // object that stores found player's stats
let earnedBadges = []

// class for basic info of a found player. anything except game stats
class PlayerProfile {
    constructor(
        id, name, height_feet, height_cm,
        weight_pounds, weight_kilos, team) {

        this.id = id,
        this.name = name,
        this. height_feet = height_feet,
        this.height_cm = height_cm,
        this.weight_pounds = weight_pounds,
        this.weight_kilos = weight_kilos,
        this.team = team        
    }

    // photo id is another api call, so it gets assigned after creation
    set photo_id(value) {
        this.photoId = value
    }
}


// array for all possible badges a player can earn
let badges = [
    {name: 'scorer',
    description: '25+ PTS',
    border_number: 25,
    code: 'pts'},
    {name: 'rebounder',
    description: '10+ REB',
    border_number: 10,
    code: 'reb'}, 
    {name: 'stealer',
    description: '1.5+ STL',
    border_number: 1.5,
    code: 'stl'}, 
    {name: 'passer',
    description: '8+ AST',
    border_number: 8,
    code: 'ast'}, 
    {name: 'rimprotector',
    description: '1.5+ BLK',
    border_number: 1.5,
    code: 'blk'}, 
    {name: 'sharpshooter',
    description: '40%+ 3PT',
    border_number: 1.5,
    code: 'fg3_pct'}, 

]

// links to retrieve the data
let searchPlayerUrl = "https://www.balldontlie.io/api/v1/players"
let searchStatsUrl
let photoSearchUrl

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
        player_profile = new PlayerProfile(
            playerInfo.data[0].id, playerInfo.data[0].first_name + " " + playerInfo.data[0].last_name,
            playerInfo.data[0].height_feet + "'" + playerInfo.data[0].height_inches,
            Math.round(playerInfo.data[0].height_feet * feetToCm  + playerInfo.data[0].height_inches * inchToCm),
            playerInfo.data[0].weight_pounds, Math.round(playerInfo.data[0].weight_pounds * poundToKg),
            playerInfo.data[0].team.name.toLowerCase().split(' ').join('') // for teams like trail blazers we eliminate spaces
        )

        // with the player's id and season, find the stat averages
        searchStatsUrl = `https://www.balldontlie.io/api/v1/season_averages?season=${season}&player_ids[]=${player_profile.id}`
        getPlayerStats(searchStatsUrl)
    }
}

// function that gets the player's stats if he played in the provided season
async function getPlayerStats(url) {
    playerStatsResponse = await fetch(searchStatsUrl).then((response) => response.json())
        if (playerStatsResponse.data == 0) { // case: player did not play that season (injured / was not in the NBA)
            tag.innerHTML = `${player_profile.name} did not play in season ${season}`
        } else { // case: data successfully received
            resultsBox.style.visibility = "visible" // display the result box

            // populate player object with the season averages
            player_stats.pts = playerStatsResponse.data[0].pts
            player_stats.reb = playerStatsResponse.data[0].reb
            player_stats.ast = playerStatsResponse.data[0].ast
            player_stats.blk = playerStatsResponse.data[0].blk
            player_stats.stl = playerStatsResponse.data[0].stl
            player_stats.fg_pct = playerStatsResponse.data[0].fg_pct
            player_stats.fg3_pct = playerStatsResponse.data[0].fg3_pct
            player_stats.ft_pct = playerStatsResponse.data[0].ft_pct
            player_stats.games_played = playerStatsResponse.data[0].games_played
            player_stats.min = playerStatsResponse.data[0].min

            // functions that display stats, photos of player and team, and earned badges (if there are any)
            displayPhotos()
            displayStats()
            displayProfile()
            createBadges(badges, player_stats)
        }

    
}

// function that displays player's averages
displayStats = () => {
        tag.innerHTML = `Averages for ${player_profile.name} in season ${season}`
        document.getElementById('games_played').innerHTML = `Games Played: ${player_stats.games_played}`
        document.getElementById('minutes').innerHTML = `Minutes Averaged: ${player_stats.min}`
        document.getElementById('pts').innerHTML = `Points: ${player_stats.pts}`
        document.getElementById('reb').innerHTML = `Rebounds: ${player_stats.reb}`
        document.getElementById('ast').innerHTML = `Assists: ${player_stats.ast}`
        document.getElementById('stl').innerHTML = `Steals: ${player_stats.stl}`
        document.getElementById('blk').innerHTML = `Blocks: ${player_stats.blk}`
        document.getElementById('field_goals').innerHTML = `Field Goals %: ${player_stats.fg_pct}`
        document.getElementById('free_throws').innerHTML = `Free Throws %: ${player_stats.ft_pct}`
        document.getElementById('three_pointers').innerHTML = `3PT %: ${player_stats.fg3_pct}`
}

// function that displays player's name and size
displayProfile = () => {
    document.getElementById('name').innerHTML = `Name: ${player_profile.name}`
    if (player_profile.height_cm == 0) {
        document.getElementById('height').innerHTML = 'Height: No Data'
    } else {
        document.getElementById('height').innerHTML = `Height: ${player_profile.height_feet} (${player_profile.height_cm} cm)`
    }
    if (player_profile.weight_kilos == 0) {
        document.getElementById('weight').innerHTML = 'Weight: No Data'
    } else {
        document.getElementById('weight').innerHTML = `Weight: ${player_profile.weight_pounds} lbs (${player_profile.weight_kilos} kg)`
    }
}

// function that analyzes if player earned any badges.
createBadges = (badges, stats) => {

    badges.forEach(badge => {
        if (stats[badge.code] >= badge.border_number ) {
            earnedBadges.push({name: badge.name, description: badge.description})
        } 
    })

    // block that checks if player earned any badges
    if (earnedBadges.length > 0) { // case: one or more badges earned
        displayBadges() // displays earned badges
        badges = [] // refreshes the badges array from previous search result
    } else { // case: no badges earned, displays the appropriate message
        document.getElementById('badgeChecker').innerHTML = `${player_profile.name} did not earn <br> any badges in ${season} season`
    }
    
}

// function that displays player's badges for the season. Runs only if player has 1+ badges.
displayBadges = () => {
    for (let badge of earnedBadges) {
        badgesContainer.innerHTML += 
        `<div class="badgeContainer">
            <img class="badge" src="images/badges/${badge.name}.png">
            <p class="badge_description">${badge.description}</p>
        </div>`
    }
}

// function that displays images of player and team
async function displayPhotos() {
    let photoElement = document.getElementById('playerPhoto')

    // the database requires to specify the season. no data can be acessed if the season is older than 2012
    if (season >= 2012) {
        let result = await fetch(`http://data.nba.net/data/10s/prod/v1/${season}/players.json`).then((response) => response.json())
        let arrOfIds = result.league.standard

        for (let i = 0; i < arrOfIds.length; i++) {
            if (arrOfIds[i].firstName == playerInfo.data[0].first_name && arrOfIds[i].lastName == playerInfo.data[0].last_name) {
                player_profile.photo_id = arrOfIds[i].personId
            }
        }

        // id for player not found
        if (player_profile.photoId === 0) {
            photoElement.innerHTML = 
            `<label>Player:</label>
            <img class="playerImage" 
            alt="Error Displaying Image">`
        } else { // id found, retrieve the photo
            photoElement.innerHTML = 
            `<label>Player:</label>
            <img class="playerImage" 
            alt="Error Displaying Image"
            src="https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player_profile.photoId}.png">`
        }
    } else { // season is 2012 and newer, no photo can be accessed
        photoElement.innerHTML = 
        `<label>Player:</label>
        <img class="playerImage" 
        alt="There is no photos for season older than 2012">`
    }

    // display current/last team of this player
    document.getElementById('teamContainer').innerHTML = `
        <label>Current (Last) Team:</label>
        <img class="teamImage" src="images/teams/${player_profile.team}.png">`

}

