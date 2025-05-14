import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import SpotifyWebApi from "spotify-web-api-node";
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const server = new McpServer({
  name: 'playlist-generator',
  version: '1.0.0',
});

server.tool("generate-playlist",
  {  
    theme: z.string().describe('The theme or mood for the playlist (e.g., "rainy day", "workout", "relaxing evening")'), 
    limit: z.number().describe('The maximum number of tracks in the playlist').optional() 
  },
  async ({ theme, limit = 10 }) => {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{
          role: "user",
          content: `Generate a list of ${limit} songs that would be perfect for ${theme}. 
                   For each song, provide the title and artist name. 
                   Format the response as a JSON array of objects with 'title' and 'artist' properties.
                   Example format: [{"title": "Song Name", "artist": "Artist Name"}]`
        }],
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        return {
          content: [{ type: "text", text: "Failed to generate playlist suggestions." }],
          isError: true
        };
      }

      const songs = JSON.parse(content).songs;

      const searchResults = await Promise.all(
        songs.map(async (song: { title: string; artist: string }) => {
          const searchResult = await spotifyApi.searchTracks(
            `${song.title} artist:${song.artist}`,
            { limit: 1 }
          );
          return {
            ...song,
            uri: searchResult.body.tracks?.items[0]?.uri
          };
        })
      );

      const validTracks = searchResults.filter((track) => track.uri !== undefined);

      const trackList = validTracks.map((track, index) => {
        return `${index + 1}. ${track.title} by ${track.artist}`;
      }).join('\n');

      return {
        content: [
          { 
            type: "text", 
            text: `Found ${validTracks.length} songs matching your theme: ${theme}\n\n${trackList}` 
          },
          {
            type: "resource",
            resource: {
              text: "Spotify Playlist URIs",
              uri: "spotify:playlist:uris",
              data: validTracks.map(track => track.uri)
            }
          }
        ]
      };
    } catch (error) {
      console.error('Error generating playlist:', error);
      return {
        content: [{ type: "text", text: "Failed to generate playlist. Please try again." }],
        isError: true
      };
    }
  }
);

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.log('Server started');
}).catch((err) => {
  console.error('Error connecting to server:', err);
});