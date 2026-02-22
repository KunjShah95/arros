import { prisma } from './prisma';
import { ActionItem, Integration } from '../types';

export class IntegrationService {
    static async getIntegrations(userId: string): Promise<Integration[]> {
        // Fake integrations for now - would normally fetch from DB
        return [
            { id: '1', name: 'notion', connected: true },
            { id: '2', name: 'github', connected: false },
            { id: '3', name: 'zotero', connected: true },
        ] as any;
    }

    static async executeAction(action: ActionItem, integrationId: string): Promise<{ success: boolean; url?: string }> {
        console.log(`Executing action ${action.title} on integration ${integrationId}`);

        // Simulate API call to Notion/GitHub
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            success: true,
            url: integrationId === '1' ? 'https://notion.so/arros-research' : 'https://github.com/arros/output',
        };
    }
}
