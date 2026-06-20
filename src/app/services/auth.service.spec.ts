import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

const clerkMock = vi.hoisted(() => {
  const instances: any[] = [];

  class MockClerk {
    session = {
      getToken: vi.fn().mockResolvedValue('test-token'),
    };
    isSignedIn = true;
    load = vi.fn().mockResolvedValue(undefined);
    addListener = vi.fn().mockImplementation((cb) => cb({ session: { getToken: () => Promise.resolve('test-token') } }));
    mountSignIn = vi.fn();
    mountSignUp = vi.fn();
    signOut = vi.fn().mockResolvedValue(undefined);

    constructor(public publishableKey: string) {
      instances.push(this);
    }
  }

  return {
    MockClerk,
    instances,
  };
});

vi.mock('@clerk/clerk-js', () => ({
  Clerk: clerkMock.MockClerk,
}));

vi.mock('@clerk/ui', () => ({
  ui: {},
}));

describe('AuthService', () => {
  beforeEach(() => {
    clerkMock.instances.length = 0;
    TestBed.configureTestingModule({});
  });

  it('loads Clerk once when initialized multiple times', async () => {
    const service = TestBed.inject(AuthService);

    await Promise.all([service.init(), service.init()]);

    expect(clerkMock.instances).toHaveLength(1);
    expect(clerkMock.instances[0].load).toHaveBeenCalledTimes(1);
    expect(service.isLoaded()).toBe(true);
    expect(service.isSignedIn()).toBe(true);
  });

  it('returns a session token after initialization', async () => {
    const service = TestBed.inject(AuthService);

    await service.init();

    await expect(service.getToken()).resolves.toBe('test-token');
  });
});
