import { AccessControl } from '../../src';
import { Role, policies } from '../mock';

describe('test acl class', () => {
  let acl: AccessControl;

  it('should define acl instance', () => {
    acl = new AccessControl(policies);

    expect(acl).toBeDefined();
    expect(acl.policies).toEqual(policies);
  });

  it('should check exists policy in db', () => {
    expect(acl.exists(policies[0])).toBeTruthy();

    expect(acl.exists({ subject: 'nothing', action: 'nothing', object: 'nothing' })).toBeFalsy();
  });

  it('should throw exception on duplication', () => {
    const arrowFn = () => acl.update({ subject: Role.Admin, action: 'any', object: 'all' });
    expect(arrowFn).toThrowError(Error('policy with subject "admin", action "any" and object "all" already exists'));
  });

  it('should return permission by can method', () => {
    expect(acl.can([Role.User], 'read', 'article').granted).toBeFalsy();
    expect(acl.can([Role.User], 'read:own', 'article').granted).toBeTruthy();

    expect(acl.can([Role.User], 'read', 'article:published').granted).toBeFalsy();
    expect(acl.can([Role.User], 'read', 'article:published', { strict: true }).granted).toBeFalsy();
    expect(acl.can([Role.User], 'read', 'article:published', { strict: false }).granted).toBeTruthy();

    expect(acl.can([Role.User], 'read', 'article:published', { strict: false, callable: () => false }).granted).toBeFalsy();
  });
});
