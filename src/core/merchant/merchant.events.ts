import { BaseEvent } from '../../utils/events.base';

export class MerchantRegisteredEvent extends BaseEvent {
        readonly eventName = 'merchant.registered';
        constructor(data: { merchantId: string; merchantEmail: string }) {
                super(data);
        }
}

export class ApiKeyGeneratedEvent extends BaseEvent {
        readonly eventName = 'merchant.api_key.created';
        constructor(data: { merchantId: string; merchantEmail: string }) {
                super(data);
        }
}

export class SecurityAlertTokenReuseEvent extends BaseEvent {
        readonly eventName = 'merchant.security.token_reuse';
        constructor(data: { merchantId: string; merchantEmail: string }) {
                super(data);
        }
}
