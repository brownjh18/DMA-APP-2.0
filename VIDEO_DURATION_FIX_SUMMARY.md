# Video Duration Fix Summary

## Problem
Ended live sermon videos (from video links) were showing `00:00` instead of the real video duration.

## Root Cause
When creating or updating a sermon with a YouTube video URL, the backend was not fetching the video details (including duration) from the YouTube API. This resulted in sermons being saved with `00:00` as the default duration.

## Solution Implemented

### 1. Backend Changes (`backend/routes/sermons.js`)

#### Added YouTube API Integration
- Added helper functions to extract video ID from YouTube URLs
- Added helper function to convert ISO 8601 duration format to readable format (mm:ss or hh:mm:ss)
- Added helper function to fetch video details from YouTube API including:
  - Duration
  - View count
  - Thumbnail URL
  - Published date
  - Live status

#### Modified Sermon Creation Route
- When creating a sermon with a `videoUrl`, the backend now:
  1. Checks if duration is missing or `00:00`
  2. Fetches video details from YouTube API
  3. Updates the sermon with fetched duration, view count, and thumbnail (if not already provided)

#### Modified Sermon Update Route
- When updating a sermon with a new `videoUrl`, the backend now:
  1. Detects if the video URL has changed
  2. Fetches video details from YouTube API
  3. Updates the sermon with fetched details (if not already provided in the request)

### 2. Database Update Script (`backend/scripts/update-sermon-durations-from-youtube.js`)

Created a script to update existing sermons that had missing durations:
- Finds all sermons with a `videoUrl` but missing/invalid duration
- Fetches video details from YouTube API for each sermon
- Updates the sermon with correct duration, view count, and thumbnail
- Includes rate limiting to avoid hitting YouTube API limits

### 3. Execution Results

Successfully updated 5 sermons:
1. **SUNDAY SERVICE || 11TH JANUARY 2026**
   - Duration: 01:37:43
   - View count: 45

2. **SUNDAY SERVICE || 11TH JANUARY 2026**
   - Duration: 01:41:13
   - View count: 21

3. **11TH JANUARY 2026 || 21 DAYS OF PRAYER & FASTING**
   - Duration: 03:11:34
   - View count: 43

4. **21 DAYS OF PRAYER ANDE FASATING**
   - Duration: 02:11:11
   - View count: 26

5. **EAGLES FRIDAY || 23RD JANUARY 2026**
   - Duration: 01:58:48
   - View count: 38

## Benefits

1. **Accurate Duration Display**: All sermons now show their actual video duration instead of `00:00`
2. **Automatic Updates**: New sermons created with YouTube URLs will automatically fetch and store the correct duration
3. **Better User Experience**: Users can now see the real length of videos before watching
4. **Additional Metadata**: Also fetches and stores view counts and thumbnails from YouTube

## Future Considerations

- The script can be run periodically to update durations for any new sermons that might have missing durations
- Consider adding error handling for cases where YouTube videos are private or deleted
- The YouTube API has rate limits, so the script includes a 1-second delay between requests

## Files Modified

1. `backend/routes/sermons.js` - Added YouTube API integration to sermon creation and update routes
2. `backend/scripts/update-sermon-durations-from-youtube.js` - New script to update existing sermons

## Testing

To verify the fix:
1. Create a new sermon with a YouTube video URL
2. Check that the duration is automatically fetched and displayed correctly
3. Update an existing sermon with a new YouTube video URL
4. Verify that the duration is updated to the new video's duration
