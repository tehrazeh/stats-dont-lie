//import fetch from 'node-fetch';

// user inputs for player search
let searchName = '' // name input
let season = '' // season input

// variables to store player stats
let playerInfo // name + size + id + team, first search, no stats
let playerStatsResponse // stats based on id search
let player_profile = {} // object with player's info wihtout stats
let player_stats = {} // object that stores found player's stats
let earnedBadges = []

let checker = 0 // variable to avoid uneccessary refreshing of html during the first search

// class for basic info of a found player. anything except game stats
class PlayerProfile {
    constructor(
        id, name, height_feet, height_cm,
        weight_pounds, weight_kilos, team, full_team_name) {

        this.id = id,
            this.name = name,
            this.height_feet = height_feet,
            this.height_cm = height_cm,
            this.weight_pounds = weight_pounds,
            this.weight_kilos = weight_kilos,
            this.team = team
        this.full_team_name = full_team_name
    }

    // photo id is another api call, so it gets assigned after creation
    set photo_id(value) {
        this.photoId = value
    }
}

class PlayerStats {
    constructor(
        pts, reb, ast, blk, stl, fg_pct, fg3_pct,
        ft_pct, games_played, min) {

        this.pts = pts
        this.reb = reb
        this.ast = ast
        this.blk = blk
        this.stl = stl
        this.fg_pct = fg_pct
        this.fg3_pct = fg3_pct
        this.ft_pct = ft_pct
        this.games_played = games_played
        this.min = min
    }

}


// array for all possible badges a player can earn
let badges = [
    {
        name: 'scorer',
        description: '25+ PTS',
        border_number: 25,
        code: 'pts'
    },
    {
        name: 'rebounder',
        description: '10+ REB',
        border_number: 10,
        code: 'reb'
    },
    {
        name: 'stealer',
        description: '1.5+ STL',
        border_number: 1.5,
        code: 'stl'
    },
    {
        name: 'passer',
        description: '8+ AST',
        border_number: 8,
        code: 'ast'
    },
    {
        name: 'rimprotector',
        description: '1.5+ BLK',
        border_number: 1.5,
        code: 'blk'
    },
    {
        name: 'sharpshooter',
        description: '40%+ 3PT',
        border_number: 40,
        code: 'fg3_pct'
    },
    {
        name: 'efficient',
        description: '50%+ FG',
        border_number: 50,
        code: 'fg_pct'
    },
    {
        name: 'freethrower',
        description: '90%+ FT',
        border_number: 90,
        code: 'ft_pct'
    },
    {
        name: 'reliable',
        description: '70+ GAMES',
        border_number: 70,
        code: 'games_played'
    },

]

// link to retrieve the data
let searchPlayerUrl = "https://www.balldontlie.io/api/v1/players"

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

// function that displays all the badges player can earn, also adds hover text with the badge name
displayAvailableBadges = () => {
    let available_badges_container = document.getElementById('badges')
    for (let badge of badges) {
        available_badges_container.innerHTML +=
            `<div class="badgeContainer">
            <h5>${badge.description}</h5>
            <img class="badge" src="images/badges/${badge.name}.png">
            <h6 class="badge_description">${badge.name}</h6>
        </div>`
    }
}

displayAvailableBadges()

// onclick event that runs every time user clicks search button
getSearchInputs = () => {

    searchName = document.getElementById('inputName').value
    season = document.getElementById('inputSeason').value
    if (checker !== 0) {
        refresher()
    }
    if (searchName == 0) { // case: no name provided 
        errorDisplay('noNameInput')

    } else if (season == 0) { // case: no season provided
        errorDisplay('noSeasonInput')

    } else if (Number.isNaN(Number(season)) === true) { // NaN provided for a season value
        errorDisplay('invalidSeasonValue')

    } else { // inputs are provided, season is a number
        getPlayer(searchName)
    }
}
const errorDisplay = (errorType) => {
    switch (errorType) {
        case 'invalidSeasonValue':
            tag.innerHTML = `Invalid season value. Please provide a number`
            break;
        case 'noSeasonInput':
            tag.innerHTML = `Please specify the Season`
            break;
        case 'noNameInput':
            tag.innerHTML = `Please specify the Name`
            break;
        default:
            tag.innerHTML = `Unexpected error. Please try later`
    }
}
// function that gets player info if the name is valid
async function getPlayer(name) {
    playerInfo = await fetch(searchPlayerUrl + `?search=${searchName}`).then((response) => response.json())

    if (season < 1981) { // case: no player has been found with that name
        tag.innerHTML = `There is no data for seasons older than 1981`
    } else if (playerInfo.data.length > 1) { // case: more than one player with that name
        tag.innerHTML = `There is more than one player named ${name} that played in ${season} season!\nPlease, specify the name more.`
    } else if (playerInfo.data == 0) { // case: season is too old, no data for that season in the database
        tag.innerHTML = `There is no player named ${name} in database records.`
    } else { // case: exactly one player found

        checker = 1 // we found a player, the next search will require refreshing
        // populate player object with id, size, name and team
        player_profile = new PlayerProfile(
            playerInfo.data[0].id, playerInfo.data[0].first_name + " " + playerInfo.data[0].last_name,
            playerInfo.data[0].height_feet + "'" + playerInfo.data[0].height_inches,
            Math.round(playerInfo.data[0].height_feet * feetToCm + playerInfo.data[0].height_inches * inchToCm),
            playerInfo.data[0].weight_pounds, Math.round(playerInfo.data[0].weight_pounds * poundToKg),
            playerInfo.data[0].team.name.toLowerCase().split(' ').join(''), // for teams like trail blazers we eliminate spaces
            playerInfo.data[0].team.full_name
        )
        // with the player's id and season, find the stat averages
        let searchStatsUrl = `https://www.balldontlie.io/api/v1/season_averages?season=${season}&player_ids[]=${player_profile.id}`
        getPlayerStats(searchStatsUrl)
    }
}

// function that gets the player's stats if he played in the provided season
async function getPlayerStats(url) {
    playerStatsResponse = await fetch(url).then((response) => response.json())
    if (playerStatsResponse.data == 0) { // case: player did not play that season (injured / was not in the NBA)
        tag.innerHTML = `${player_profile.name} did not play in season ${season}`
    } else { // case: data successfully received
        resultsBox.style.visibility = "visible" // display the result box

        // create player_stats object and populate it with the season averages
        player_stats = new PlayerStats(
            playerStatsResponse.data[0].pts, playerStatsResponse.data[0].reb,
            playerStatsResponse.data[0].ast, playerStatsResponse.data[0].blk,
            playerStatsResponse.data[0].stl, roundPercentages(playerStatsResponse.data[0].fg_pct * 100),
            roundPercentages(playerStatsResponse.data[0].fg3_pct * 100),
            roundPercentages(playerStatsResponse.data[0].ft_pct * 100),
            playerStatsResponse.data[0].games_played, playerStatsResponse.data[0].min
        )
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

    // get the each property for stat and add it to html
    let properties = Object.getOwnPropertyNames(player_stats)
    for (prop of properties) {
        document.getElementById(`${prop}`).innerHTML += player_stats[prop]
    }
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
        if (stats[badge.code] >= badge.border_number) {
            earnedBadges.push({ name: badge.name, description: badge.description })
        }
    })

    // block that checks if player earned any badges
    if (earnedBadges.length > 0) { // case: one or more badges earned
        displayBadges() // displays earned badges
    } else { // case: no badges earned, displays the appropriate message
        document.getElementById('badgeChecker').innerHTML = `${player_profile.name} did not earn <br> any badges in ${season} season`
    }

}

// function that displays player's badges for the season. Runs only if player has 1+ badges.
displayBadges = () => {
    badgesContainer.innerHTML = `<h5>${player_profile.name} earned following badges in ${season} season</h5>`
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
                `<label>Error displaying player image</label>
            <img class="playerImage" 
            alt="Error Displaying Image"
            src="/images/not_player.png">`
        } else { // id found, retrieve the photo
            photoElement.innerHTML =
                `<label>Player:</label>
            <img class="playerImage" 
            alt="Error Displaying Image"
            src="https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player_profile.photoId}.png">
            <p class="player_photo_description">${player_profile.name}</p>`
        }
    } else { // season is 2012 and newer, no photo can be accessed
        photoElement.innerHTML =
            `<label>No photos available for season 2012 and older</label>
        <img class="playerImage" 
        alt="There is no photos for season older than 2012"
        src="/images/not_player.png">`
    }

    // display current/last team of this player
    document.getElementById('teamContainer').innerHTML = `
        <label>Current (Last) Team:</label>
        <img class="teamImage" src="images/teams/${player_profile.team}.png">
        <p class="team_photo_description">${player_profile.full_team_name}</p>`

}


const refresher = () => {

    // refreshes the earned badges container for each new search
    badgesContainer.innerHTML =
        `<h5 id="badgeChecker"></h5>`

    // refreshes the stats container for each new search
    document.getElementById('seasonStats').innerHTML =
        `<h5 id="games_played">Games Played: </h5>
    <br><br>
    <h5 id="min">Minutes Averaged: </h5>
    <br>                 
    <br>                 
    <h5 id="pts">Points: </h5>&nbsp;&nbsp;&nbsp;&nbsp;
    <h5 id="reb">Rebounds: </h5>
    <br>
    <br>
    <h5 id="ast">Assists: </h5>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <h5 id="blk">Blocks: </h5>
    <br>
    <br>
    <h5 id="stl">Steals: </h5>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <h5 id="fg_pct">Field Goals %: </h5>
    <br>
    <br>
    <h5 id="ft_pct">Free Throws %: </h5>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <h5 id="fg3_pct">3PT %: </h5> `

    earnedBadges = [] // refreshes the badges array from previous search result
    player_profile = 0
    player_stats = 0
    resultsBox.style.visibility = "hidden"
}

const roundPercentages = (value) => {
    return Math.round(value * 100) / 100
}
