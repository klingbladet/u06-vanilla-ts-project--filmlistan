// API-anrop till Movie API
import type { DatabaseMovie, CreateMovieBody } from "../types/movie";
const API_BASE_URL = 'http://localhost:3000/api';
const USER_ID = 'Chas-n-Chill';

const headers = {
  'Content-Type': 'application/json',
  'x-user-id': USER_ID
};
// 
export async function getMovies(): Promise<DatabaseMovie[]> {
  const response = await fetch(`${API_BASE_URL}/movies`, {
    headers: headers
  });
  if (!response.ok) {
    throw new Error ('Kunde inte hämta filmerna');
  }
  return await response.json();
}
//
export async function addMovie(movie: CreateMovieBody): Promise<DatabaseMovie> {
  const response = await fetch(`${API_BASE_URL}/movies`, {
    method: 'POST',
    headers: headers,

    body: JSON.stringify(movie)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Kunde inte spara filmen');
  }
  return await response.json();
}
//
export async function updateMovie(id: number, data: Partial<CreateMovieBody>): Promise<DatabaseMovie> {
  const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error('Kunde inte uppdatera filmerna!');
  }
  return await response.json();
}
//Make sure to remove the movie and give error msg if it fails to do so.
export async function deleteMovie(id:number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
    method: 'DELETE',
    headers: headers
  });
  if (!response.ok) {
    throw new Error('´Kunde inte ta bort filmen');
  }
}