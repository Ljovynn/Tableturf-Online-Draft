import mysql from 'mysql2'

import dotenv from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

export async function GetDraft(id){
    const [rows] = await pool.query(`SELECT *, SUBSTRING(DATE_FORMAT(\`last_update\`, '%Y-%m-%d %T.%f'),1,21) as formatted_update FROM drafts WHERE id = ?`, [id])
    return rows[0];
}

export async function GetPlayersInDraft(draftId){
    const [rows] = await pool.query(`SELECT * FROM players WHERE draft_id = ? ORDER BY id`, [draftId])
    return rows;
}

export async function GetDeckCards(playerId){
    const [rows] = await pool.query(`SELECT * FROM deck_cards WHERE player_id = ? ORDER BY pick_order`, [playerId])
    return rows;
}

export async function GetDeckCount(playerId){
    const [count] = await pool.query(`SELECT COUNT(*) AS deckCount FROM deck_cards WHERE player_id = ?`, [playerId])
    return count[0].deckCount;
}

export async function GetDraftCards(draftId){
    const [rows] = await pool.query(`SELECT * FROM draft_cards WHERE draft_id = ?`, [draftId])
    return rows;
}

export async function CreateDraft(timer, stage){
    const result = await pool.query(`INSERT INTO drafts (timer, stage) VALUES (?, ?)`, [timer, stage])
    return JSON.stringify(result[0].insertId);
}

export async function CreatePlayers(draft_id, playerNames){
    await pool.query(`INSERT INTO players (draft_id, player_name) VALUES (?, ?), (?, ?)`, [draft_id, playerNames[0], draft_id, playerNames[1]]);
}

export async function CreateDraftCards(draft_id, cards){
    var data = [];
    for (let i = 0; i < cards.length; i++){
        data[i] = [draft_id, cards[i]];
    }
    await pool.query(`INSERT INTO draft_cards (draft_id, card_id) VALUES ?`, [data.map(card => [card[0], card[1]])]);
}

export async function CreateDeckCard(player_id, pick_order, card_id){
    await pool.query(`INSERT INTO deck_cards (player_id, pick_order, card_id) VALUES (?, ?, ?)`, [player_id, pick_order, card_id])
}

export async function StartDraft(draft_id){
    await pool.query(`UPDATE drafts SET draft_phase = 1, player_turn = 1, picks_until_change_turn = 1, last_update = NOW() WHERE id = ?`,
    [draft_id])
}

export async function UpdateDraft(draft_id, draft_phase, player_turn, picks_until_change_turn, shouldUpdateTimer){
    if (shouldUpdateTimer){
        await pool.query(`UPDATE drafts SET draft_phase = ?, player_turn = ?, picks_until_change_turn = ?, last_update = NOW() WHERE id = ?`,
        [draft_phase, player_turn, picks_until_change_turn, draft_id])
    } else{
        await pool.query(`UPDATE drafts SET draft_phase = ?, player_turn = ?, picks_until_change_turn = ? WHERE id = ?`,
        [draft_phase, player_turn, picks_until_change_turn, draft_id])
    }
}

export async function PlayerReady (player_id){
    await pool.query(`UPDATE players SET ready = TRUE WHERE id = ?`, [player_id])
}

//const result = await CreateDraft(20, 2);
/*const result = await GetDraft(9);
const result2 = JSON.stringify(result);
console.log(result2 + " json")
console.log(result + " databaseresult!")*/