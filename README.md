# MCP Playlist Generator

An MCP server that generates Spotify playlists based on themes or moods using ChatGPT and Spotify API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
OPENAI_API_KEY=your_openai_api_key
```

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

## Usage

The server provides a tool called `generate-playlist` that accepts a theme parameter. You can use it to generate playlists for various moods or themes, such as:

- "a rainy day"
- "working out"
- "relaxing evening"
- "road trip"

The tool will:
1. Use ChatGPT to generate a list of appropriate songs for the theme
2. Search for these songs on Spotify
3. Return a list of Spotify track URIs that can be used to create a playlist

## Development

For development with hot-reloading:
```bash
npm run dev
``` 