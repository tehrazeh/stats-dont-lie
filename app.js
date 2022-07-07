//import fetch from 'node-fetch';

let searchName = 'lebron'
let season = '2007'
let playerInfo // name + size + id + team, first search, no stats
let playerStatsResponse // stats based on id search
let playerStats = {} // object that stores found player's stats
let badges = [] // badges info for player
let searchPlayerUrl = "https://www.balldontlie.io/api/v1/players"
let searchStatsUrl
let tag = document.getElementById('search_result')
let resultsBox = document.getElementById('resultsBox')
let badgesContainer = document.getElementById('earnedBadges')
const feetToCm = 30.48
const inchToCm = 2.54
const poundToKg = 0.453592
resultsBox.style.visibility = "hidden"
getSearchInputs = () => { 
    resultsBox.style.visibility = "hidden" 
    searchName = document.getElementById('inputName').value
    season = document.getElementById('inputSeason').value
    if (searchName == 0) {
        alert('Please specify the Name')
    } else if (season == 0) {
        alert('Please specify the Season')
    } else {
       // console.log(`Searched Name: ${searchName}\nSearched Season: ${season}`)
        getPlayer(searchName)
    }
    badgesContainer.innerHTML = 
    `<label>Badges:</label>
    <h5 id="badgeChecker"></h5>`
}




async function getPlayer(name) {
    playerInfo = await fetch(searchPlayerUrl + `?search=${searchName}`).then((response) => response.json())
    if (playerInfo.data == 0) { // no player has been found with that name
        tag.innerHTML = `There is no player named ${name} that ever played in the NBA`  
    } else if (playerInfo.data.length > 1) { // more than one player with that name
        tag.innerHTML = `There is more than one player named ${name} that played in ${season} season!\nPlease, specify the name more.`
    } else { // exactly one player found
        playerStats.id = playerInfo.data[0].id
        searchStatsUrl = `https://www.balldontlie.io/api/v1/season_averages?season=${season}&player_ids[]=${playerStats.id}`
        getPlayerStats(searchStatsUrl)
        playerStats.name = playerInfo.data[0].first_name + " " + playerInfo.data[0].last_name
        playerStats.height_feet = playerInfo.data[0].height_feet + "'" + playerInfo.data[0].height_inches
        playerStats.height_cm = Math.round(playerInfo.data[0].height_feet * feetToCm  + playerInfo.data[0].height_inches * inchToCm)
        playerStats.weight_pounds = playerInfo.data[0].weight_pounds
        playerStats.weight_kilos = Math.round(playerInfo.data[0].weight_pounds * poundToKg)
        playerStats.team = playerInfo.data[0].team.name.toLowerCase()
    }
}

async function getPlayerStats(url) {
    playerStatsResponse = await fetch(searchStatsUrl).then((response) => response.json())
        if (playerStatsResponse.data == 0) {
            tag.innerHTML = `${playerStats.name} did not play in season ${season}`
        } else {
            resultsBox.style.visibility = "visible"
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
            displayStats()
            displayProfile()
            displayPhotos()
            createBadges()
            //todo function displayParameters that will display size + team name
        }

    
}

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

createBadges = () => {
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

    if (badges.length > 0) {
        displayBadges()
        badges = []
    } else {
        document.getElementById('badgeChecker').innerHTML = `${playerStats.name} did not earn <br> any badges in ${season} season`
    }
    
}

displayBadges = () => {
    badges.forEach(badge => {
        badgesContainer.innerHTML += 
        `<div class="badgeContainer">
            <img class="badge" src="images/badges/${badge}.png">
        </div>`
    })
}
let checker = 0
displayPhotos = () => {
 
    document.getElementById('teamContainer').innerHTML = `
    <label>Current (Last) Team:</label>
    <img class="teamImage" src="images/teams/${playerStats.team}.png">`

    //TODO: add try catch to add a placeholder for photo if player foto not found
    //ADD BUTTON that shows how to use the app
    try {
        document.getElementById('playerPhoto').innerHTML = 
        `<label>Player:</label>
        <img class="playerImage" 
        alt="There is no photo for ${playerStats.name}. 
        Photos only for:
        Lebron James, Michael Jordan, Kobe Bryant, Tim Duncan, Stephen Curry, 
        Kevin Durant, Kawhi Leonard"
        src="images/players/${playerStats.name.split(' ').join('').toLowerCase()}.png">`
    } catch(e) {
        console.log("error")
    } finally {
        console.log(checker)
    }
    
}

