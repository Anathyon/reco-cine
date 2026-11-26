import { authDomain, firebaseConfig } from '../firebase';

const at = (url: string) => new URL(url);

describe('authDomain', () => {
  it('em produção usa o próprio domínio do site (login pelo proxy /__/auth)', () => {
    expect(authDomain(at('https://reco-cine.vercel.app/movies'))).toBe('reco-cine.vercel.app');
  });

  it('em localhost usa o domínio do Firebase', () => {
    expect(authDomain(at('http://localhost:3000/'))).toBe(firebaseConfig.authDomain);
  });

  it('em http na rede local usa o domínio do Firebase', () => {
    expect(authDomain(at('http://192.168.0.10:3000/'))).toBe(firebaseConfig.authDomain);
  });
});
