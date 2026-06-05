import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfpjncepavtknpvzxdjg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcGpuY2VwYXZ0a25wdnp4ZGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MDU4MjQsImV4cCI6MjA2NDM4MTgyNH0.UY9_mey8iTJ0kKSDsY8_7KoRvQTB2F2-A1Kcs7jmzYU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export async function loginOrAutoRegister(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error?.message?.includes('Invalid login credentials')) {
    throw new Error('邮箱或密码错误，请检查后重试');
  }

  if (error?.message?.includes('not found') || error?.message?.includes('User not found')) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });
    if (signUpError) throw signUpError;
    return signUpData;
  }

  if (error) throw error;
  return data;
}

// 发送验证码（OTP）到邮箱
export async function sendResetOTP(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });
  if (error) throw error;
}

// 验证 OTP/token 并设置新密码
export async function verifyOTPAndResetPassword(email: string, token: string, newPassword: string) {
  // 使用 token 验证（magiclink 类型匹配 signInWithOtp 发送的验证码）
  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'magiclink',
  });
  if (verifyError) throw verifyError;

  // 验证成功后更新密码
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) throw updateError;

  return verifyData;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function deleteUserAccount() {
  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  // 删除用户数据（deliveries 等）
  await supabase.from('deliveries').delete().eq('user_id', user.id);
  await supabase.from('interviews').delete().eq('user_id', user.id);

  // 注销账号
  await supabase.auth.signOut();
}
