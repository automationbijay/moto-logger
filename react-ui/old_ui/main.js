import { createClient } from '@supabase/supabase-js'

// Setup Supabase Client
// Note: You need to add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// DOM Elements
const appDiv = document.getElementById('app')

// State
let session = null

// Views
const renderLoginForm = () => {
  appDiv.innerHTML = `
    <div class="auth-container">
      <div class="auth-header">
        <h1>Welcome Back</h1>
        <p>Sign in to your account</p>
      </div>
      <div id="auth-message" class="message"></div>
      <form id="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" class="form-control" placeholder="you@example.com" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" class="form-control" placeholder="••••••••" required />
        </div>
        <button type="submit" class="btn btn-primary" id="submit-btn">Sign In</button>
      </form>
      <button id="toggle-signup" class="btn btn-secondary">Don't have an account? Sign up</button>
    </div>
  `

  document.getElementById('login-form').addEventListener('submit', handleLogin)
  document.getElementById('toggle-signup').addEventListener('click', renderSignupForm)
}

const renderSignupForm = () => {
  appDiv.innerHTML = `
    <div class="auth-container">
      <div class="auth-header">
        <h1>Create Account</h1>
        <p>Join Motorcycle Log today</p>
      </div>
      <div id="auth-message" class="message"></div>
      <form id="signup-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" class="form-control" placeholder="you@example.com" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" class="form-control" placeholder="••••••••" required minlength="6" />
        </div>
        <button type="submit" class="btn btn-primary" id="submit-btn">Sign Up</button>
      </form>
      <button id="toggle-login" class="btn btn-secondary">Already have an account? Sign in</button>
    </div>
  `

  document.getElementById('signup-form').addEventListener('submit', handleSignup)
  document.getElementById('toggle-login').addEventListener('click', renderLoginForm)
}

const renderDashboard = (user) => {
  appDiv.innerHTML = `
    <div class="auth-container dashboard">
      <div class="auth-header">
        <h1>Dashboard</h1>
        <p>You are successfully logged in</p>
      </div>
      <div class="user-info">
        <strong>Email:</strong> ${user.email}
      </div>
      <button id="logout-btn" class="btn btn-primary">Sign Out</button>
    </div>
  `

  document.getElementById('logout-btn').addEventListener('click', handleLogout)
}

// Helpers
const showMessage = (msg, type) => {
  const msgEl = document.getElementById('auth-message')
  if (msgEl) {
    msgEl.textContent = msg
    msgEl.className = \`message \${type}\`
  }
}

const setLoading = (isLoading) => {
  const btn = document.getElementById('submit-btn')
  if (btn) {
    btn.disabled = isLoading
    btn.textContent = isLoading ? 'Please wait...' : (btn.textContent.includes('Sign In') ? 'Sign In' : 'Sign Up')
  }
}

// Actions
const handleLogin = async (e) => {
  e.preventDefault()
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  
  setLoading(true)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  setLoading(false)

  if (error) {
    showMessage(error.message, 'error')
  } else {
    session = data.session
    renderDashboard(session.user)
  }
}

const handleSignup = async (e) => {
  e.preventDefault()
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  
  setLoading(true)
  const { data, error } = await supabase.auth.signUp({ email, password })
  setLoading(false)

  if (error) {
    showMessage(error.message, 'error')
  } else {
    showMessage('Check your email for the confirmation link!', 'success')
    // If auto-confirm is enabled in Supabase, they might be logged in immediately
    if (data.session) {
      session = data.session
      renderDashboard(session.user)
    }
  }
}

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error logging out:', error.message)
  }
  session = null
  renderLoginForm()
}

// Initialize
const init = async () => {
  const { data: { session: currentSession } } = await supabase.auth.getSession()
  session = currentSession
  
  if (session) {
    renderDashboard(session.user)
  } else {
    renderLoginForm()
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange((_event, newSession) => {
    session = newSession
    if (session) {
      renderDashboard(session.user)
    } else {
      renderLoginForm()
    }
  })
}

init()
