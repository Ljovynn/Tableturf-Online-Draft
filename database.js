import mysql from 'mysql2'

import dotenv from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

export async function GetDrafts(){
    const [rows] = await pool.query("SELECT * FROM drafts")
    return rows;
}

export async function GetDraft(id){
    const [rows] = await pool.query(`SELECT * FROM drafts WHERE id = ?`, [id])
    return rows[0];
}

export async function GetPlayersInDraft(draftId){
    const [rows] = await pool.query(`SELECT * FROM players WHERE draft_id = ? ORDER BY id`, [draftId])
    return rows;
}

export async function GetPlayer(playerId){
    const [rows] = await pool.query(`SELECT * FROM players WHERE id = ?`, [playerId])
    return rows;
}

export async function GetDeckCards(playerId){
    const [rows] = await pool.query(`SELECT * FROM deck_cards WHERE player_id = ?`, [playerId])
    return rows;
}

export async function GetDraftCards(draftId){
    const [rows] = await pool.query(`SELECT * FROM draft_cards WHERE draft_id = ?`, [draftId])
    return rows;
}

export async function CreateDraft(){
    const result = await pool.query(`INSERT INTO drafts () VALUES ()`)
    return JSON.stringify(result[0].insertId);
}

export async function CreatePlayer(draft_id, player_name){
    const result = await pool.query(`INSERT INTO players (draft_id, player_name) VALUES (?, ?)`, [draft_id, player_name])
    return JSON.stringify(result[0].insertId);
}

export async function CreateDraftCard(draft_id, card_id){
    await pool.query(`INSERT INTO draft_cards (draft_id, card_id) VALUES (?, ?)`, [draft_id, card_id])
}

export async function CreateDeckCard(player_id, pick_order, card_id){
    await pool.query(`INSERT INTO deck_cards (player_id, pick_order, card_id) VALUES (?, ?, ?)`, [player_id, pick_order, card_id])
}

export async function UpdateDraft(draft_id, draft_phase, player_turn, picks_until_change_turn){
    await pool.query(`UPDATE drafts SET draft_phase = ?, player_turn = ?, picks_until_change_turn = ?, last_update = NOW() WHERE id = ?`,
    [draft_phase, player_turn, picks_until_change_turn, draft_id])
}

export async function PlayerReady (player_id){
    await pool.query(`UPDATE players SET ready = TRUE WHERE id = ?`, [player_id])
}

//await UpdateDraft(27, 1, 2, 2)
//const result = await CreateDraft()
//console.log(result + " databaseresult!")