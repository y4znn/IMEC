import fs from 'fs/promises';
import path from 'path';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
    let profileData = null;
    try {
        const contentPath = path.join(process.cwd(), 'content', 'researcherProfile.json');
        const fileContents = await fs.readFile(contentPath, 'utf8');
        profileData = JSON.parse(fileContents);
    } catch {
        console.error("Failed to read profile data. Using fallback.");
    }

    return (
        <ProfileClient storyData={profileData} />
    );
}
