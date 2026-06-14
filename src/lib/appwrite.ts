import { Client, Databases, ID } from 'appwrite';

export const appwriteConfig = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'sgp-6a2ce46a003230dcf661',
  databaseId: '6a2ce492003a18046d9b',
  collectionId: 'releases',
};

export const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

export const databases = new Databases(client);
export { ID };