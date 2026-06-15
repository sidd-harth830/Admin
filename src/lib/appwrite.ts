import { Client, Databases, Account, ID } from 'appwrite';

export const appwriteConfig = {
  endpoint:
    import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1',
  projectId:
    import.meta.env.VITE_APPWRITE_PROJECT_ID || '6a2ce46a003230dcf661',
  databaseId:
    import.meta.env.VITE_APPWRITE_DATABASE_ID || '6a2ce492003a18046d9b',
  collectionId:
    import.meta.env.VITE_APPWRITE_RELEASES_COLLECTION_ID || 'releases',
  usersCollectionId:
    import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users',
};

export const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

export const databases = new Databases(client);
export const account = new Account(client);
export { ID };