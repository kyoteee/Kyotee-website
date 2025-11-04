import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.4/+esm';

const SUPABASE_URL = 'https://xyteodhmrskgtttxosik.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dGVvZGhtcnNrZ3R0dHhvc2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzEyMTMsImV4cCI6MjA3MDk0NzIxM30.O6ghjOLHmsmfeP78UWyive638WxpH-rsfqq0od6E4Fg';
const DEV_USER_ID = 'a41f959f-fbfe-41ae-8daf-40beaa876635';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storage: localStorage,
  },
});

const PREFS_KEY = 'kyotee_preview_prefs_v2';
const ACCOUNT_DELETION_URL = 'https://kyoteee.github.io/Kyotee/delete-account.html';
const PARTIAL_DATA_URL = 'https://kyoteee.github.io/Kyotee/manage-data.html';
const PRIVACY_POLICY_URL = 'https://kyoteee.github.io/Kyotee/privacy-policy.html';
const ACCOUNT_DELETION_EMAIL = 'support@kyoteeapp.com';
const storedPrefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
const MESSAGE_JSON_PREFIX = '__kyotee_msg__:';
const LOCAL_MESSAGES_PREFIX = 'kyotee_preview_msgs_v1:';
const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;
const POST_CREATED_FLAG_KEY = 'kyotee_recent_post';

const appState = {
  feedMode: storedPrefs.feedMode || 'latest',
  themePreference: storedPrefs.themePreference || 'light',
  lastScreen: storedPrefs.lastScreen || 'feed',
  engagementMode: storedPrefs.engagementMode || 'likes',
  posts: [],
  postMeta: {},
  searchUsers: [],
  searchPosts: [],
  friends: [],
  friendRequests: { incoming: [], outgoing: [] },
  conversations: {},
  profile: null,
  myPosts: [],
  feedLoaded: false,
  friendsLoaded: false,
  friendRequestsLoaded: false,
  profileLoaded: false,
  comments: {},
};
if (appState.engagementMode !== 'likes' && appState.engagementMode !== 'slider') {
  appState.engagementMode = 'likes';
}

const externalPostsCache = new Map();

let session = null;
let currentUser = null;
let activeChat = null;
let transientProfile = null;
let searchTimer = null;
let snackbarTimer = null;
let authOverlayRemoved = false;
let friendRequestsLoading = false;
let chatAttachmentFile = null;
let chatAttachmentPreviewUrl = null;
let activeCommentsPost = null;
let activeReplyTarget = null;
let replyInFlight = false;

const authOverlay = document.getElementById('auth-overlay');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const loginSubmit = document.getElementById('login-submit');

const registerForm = document.getElementById('register-form');
const registerEmail = document.getElementById('register-email');
const registerUsername = document.getElementById('register-username');
const registerPassword = document.getElementById('register-password');
const registerConfirm = document.getElementById('register-confirm');
const registerPhone = document.getElementById('register-phone');
const registerBirthday = document.getElementById('register-birthday');
const registerError = document.getElementById('register-error');
const registerSuccess = document.getElementById('register-success');
const registerSubmit = document.getElementById('register-submit');

const navButtons = Array.from(document.querySelectorAll('.bottom-nav button'));
const screenElements = {
  feed: document.getElementById('screen-feed'),
  search: document.getElementById('screen-search'),
  messages: document.getElementById('screen-messages'),
  profile: document.getElementById('screen-profile'),
};

const feedModeSelect = document.getElementById('feed-mode');
const feedList = document.getElementById('feed-list');
const createPostFab = document.getElementById('create-post-fab');

const searchInput = document.getElementById('search-input');
const searchLoading = document.getElementById('search-loading');
const searchResults = document.getElementById('search-results');

const friendsLoading = document.getElementById('friends-loading');
const friendsList = document.getElementById('friends-list');
const chatCard = document.getElementById('chat-card');
const chatUsername = document.getElementById('chat-username');
const chatAvatar = document.getElementById('chat-avatar');
const chatSubtitle = document.getElementById('chat-sub');
const messagesList = document.getElementById('messages-list');
const chatForm = document.getElementById('chat-form');
const msgInput = document.getElementById('msg-input');
const chatAttachBtn = document.getElementById('chat-attach-btn');
const chatImageInput = document.getElementById('chat-image-input');
const chatImagePreview = document.getElementById('chat-image-preview');

const profileUsernameEl = document.getElementById('profile-username');
const profileEmailEl = document.getElementById('profile-email');
const profilePhoneEl = document.getElementById('profile-phone');
const profileAvatar = document.getElementById('profile-avatar');
const myPostsContainer = document.getElementById('my-posts');
const profileFriendActions = document.getElementById('profile-friend-actions');
const profileFriendsEmpty = document.getElementById('profile-friends-empty');
const profileFriendsList = document.getElementById('profile-friends');
const profileFriendRequestsCard = document.getElementById('profile-friend-requests-card');
const profileFriendRequestsEmpty = document.getElementById('profile-friend-requests-empty');
const profileFriendRequestsIncomingWrapper = document.getElementById(
  'profile-friend-requests-incoming-wrapper',
);
const profileFriendRequestsOutgoingWrapper = document.getElementById(
  'profile-friend-requests-outgoing-wrapper',
);
const profileFriendRequestsIncoming = document.getElementById('profile-friend-requests-incoming');
const profileFriendRequestsOutgoing = document.getElementById('profile-friend-requests-outgoing');
const profileEditActions = document.getElementById('profile-edit-actions');
const profileAvatarInput = document.getElementById('profile-avatar-input');
const profileAvatarChangeBtn = document.getElementById('profile-avatar-change');
const profileUsernameEditBtn = document.getElementById('profile-username-edit');
const profilePhoneEditBtn = document.getElementById('profile-phone-edit');
const profileAdminCard = document.getElementById('profile-admin-card');
const adminUserSearchBtn = document.getElementById('admin-user-search');
const adminBanDashboardBtn = document.getElementById('admin-ban-dashboard');
const adminReportsBtn = document.getElementById('admin-reports');
const shareProfileBtn = document.getElementById('share-profile');
const logoutBtn = document.getElementById('logout-btn');

const themeSelect = document.getElementById('theme-select');
const engagementToggle = document.getElementById('engagement-toggle');
const engagementToggleLabel = document.getElementById('engagement-toggle-label');
const privacyPolicyBtn = document.getElementById('privacy-policy-btn');
const manageDataBtn = document.getElementById('manage-data-btn');
const deleteAccountBtn = document.getElementById('delete-account-btn');
const privacyEmailElems = Array.from(document.querySelectorAll('.privacy-email'));
const snackbarEl = document.getElementById('snackbar');
const commentsOverlay = document.getElementById('comments-overlay');
const commentsCloseBtn = document.getElementById('comments-close-btn');
const commentsList = document.getElementById('comments-list');
const commentsPostPreview = document.getElementById('comments-post-preview');
const commentsModalSubtitle = document.getElementById('comments-modal-subtitle');
const commentsInputSection = document.getElementById('comments-input-section');
const commentsSigninHint = document.getElementById('comments-signin-hint');
const commentForm = document.getElementById('comment-form');
const commentTextarea = document.getElementById('comment-textarea');
const commentSubmit = document.getElementById('comment-submit');
const replyIndicator = document.getElementById('reply-indicator');
const replyIndicatorText = document.getElementById('reply-indicator-text');
const replyIndicatorCancel = document.getElementById('reply-indicator-cancel');

let profileRelation = { status: 'self', requestId: null };
let profileRelationTarget = null;
privacyEmailElems.forEach((el) => {
  if (el) {
    el.innerHTML = `<a href="mailto:${ACCOUNT_DELETION_EMAIL}">${ACCOUNT_DELETION_EMAIL}</a>`;
  }
});

function isDevUser(userId) {
  return Boolean(userId && userId === DEV_USER_ID);
}

function assertAdminAccess() {
  if (!isDevUser(currentUser?.id)) {
    showSnackbar('Admin tools are restricted to the Kyotee team.');
    return false;
  }
  return true;
}

function openAdminTool(view = 'users') {
  if (!assertAdminAccess()) return;
  const target = `./admin-tools.html?view=${encodeURIComponent(view)}`;
  if (window.matchMedia('(max-width: 720px)').matches) {
    window.location.href = target;
  } else {
    window.open(target, 'kyoteeAdminTool', 'width=960,height=720');
  }
}

function persistPrefs() {
  localStorage.setItem(
    PREFS_KEY,
    JSON.stringify({
      feedMode: appState.feedMode,
      themePreference: appState.themePreference,
      lastScreen: appState.lastScreen,
      engagementMode: appState.engagementMode,
    }),
  );
}

function getSliderKey(postId) {
  if (!currentUser) return `sliderRating:guest:${postId}`;
  return `sliderRating:${currentUser.id}:${postId}`;
}

function ensurePostMeta(postId) {
  if (!appState.postMeta[postId]) {
    appState.postMeta[postId] = {
      likes: 0,
      dislikes: 0,
      comments: 0,
      myReaction: null,
    };
  }
  return appState.postMeta[postId];
}

function getSliderRating(postId) {
  try {
    const stored = localStorage.getItem(getSliderKey(postId));
    const value = Number.parseInt(stored ?? '', 10);
    if (Number.isFinite(value) && value >= 1 && value <= 10) return value;
  } catch (_error) {
    // no-op
  }
  return 5;
}

function setSliderRating(postId, value) {
  const clamped = Math.max(1, Math.min(10, value));
  try {
    localStorage.setItem(getSliderKey(postId), String(clamped));
  } catch (_error) {
    // no-op
  }
  return clamped;
}

function isViewingOwnProfile() {
  if (!currentUser) return false;
  if (!transientProfile) return true;
  return transientProfile.id === currentUser.id;
}

function localMessageKey(userId, friendId) {
  return `${LOCAL_MESSAGES_PREFIX}${userId}:${friendId}`;
}

function readLocalMessages(userId, friendId) {
  try {
    const raw = localStorage.getItem(localMessageKey(userId, friendId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (_error) {
    // no-op
  }
  return [];
}

function writeLocalMessages(userId, friendId, messages) {
  try {
    localStorage.setItem(localMessageKey(userId, friendId), JSON.stringify(messages));
  } catch (_error) {
    // no-op
  }
}

function mergeMessages(primary, secondary) {
  const merged = [];
  const seen = new Map();
  [...primary, ...secondary].forEach((msg) => {
    if (!msg) return;
    const key = msg.id || msg.localKey || `${msg.sender_id}-${msg.created_at}`;
    if (seen.has(key)) return;
    seen.set(key, true);
    merged.push(msg);
  });
  merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return merged;
}

function storeLocalMessage(userId, friendId, message) {
  if (!userId || !friendId || !message) return;
  const record = { ...message };
  if (!record.created_at) record.created_at = new Date().toISOString();
  if (!record.id && !record.localKey) {
    record.localKey = `local:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  }
  const existing = readLocalMessages(userId, friendId);
  const merged = mergeMessages(existing, [record]);
  writeLocalMessages(userId, friendId, merged);
}

function clearStoredMessages() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_MESSAGES_PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (_error) {
    // no-op
  }
}

function resetChatAttachment() {
  chatAttachmentFile = null;
  if (chatAttachmentPreviewUrl) {
    URL.revokeObjectURL(chatAttachmentPreviewUrl);
    chatAttachmentPreviewUrl = null;
  }
  if (chatImageInput) chatImageInput.value = '';
  if (chatImagePreview) {
    chatImagePreview.src = '';
    chatImagePreview.hidden = true;
  }
}

async function uploadChatImage(file, userId) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const safeExt = allowed.includes(ext) ? ext : 'jpg';
  const path = `message_uploads/${userId}/${Date.now()}.${safeExt}`;
  const { error } = await supabase.storage
    .from('post_images')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('post_images').getPublicUrl(path);
  return data.publicUrl;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });
}

async function convertFileToJpeg(file) {
  if (!file) throw new Error('No file provided.');
  const type = (file.type || '').toLowerCase();
  if (type === 'image/jpeg' || type === 'image/jpg') return file;
  const dataUrl = await readFileAsDataURL(file);
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to process image.'));
    img.src = typeof dataUrl === 'string' ? dataUrl : '';
  });
  const canvas = document.createElement('canvas');
  const width = image.naturalWidth || image.width || 512;
  const height = image.naturalHeight || image.height || 512;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported.');
  ctx.drawImage(image, 0, 0, width, height);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to create image blob.'));
        }
      },
      'image/jpeg',
      0.9,
    );
  });
  return blob;
}

async function uploadProfileAvatar(file, userId) {
  if (!file) throw new Error('No file selected.');
  if (!userId) throw new Error('Missing user identifier.');
  const processed = await convertFileToJpeg(file);
  const uploadBlob =
    processed instanceof File
      ? processed
      : typeof File !== 'undefined'
        ? new File([processed], 'avatar.jpg', { type: 'image/jpeg' })
        : processed;
  const path = `profile_pictures/${userId}.jpg`;
  const { error } = await supabase.storage.from('profile_pictures').upload(path, uploadBlob, {
    cacheControl: '3600',
    upsert: true,
    contentType: 'image/jpeg',
  });
  if (error) throw error;
  const { data } = supabase.storage.from('profile_pictures').getPublicUrl(path);
  const url = data?.publicUrl || '';
  return url ? `${url}?t=${Date.now()}` : url;
}

async function applyProfileUpdates(updates) {
  if (!currentUser) throw new Error('Sign in to update your profile.');
  if (!updates || typeof updates !== 'object') return null;
  const payload = { ...updates };
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });
  if (!Object.keys(payload).length) return null;
  let applied = { ...payload };
  const { error } = await supabase.from('profiles').update(payload).eq('id', currentUser.id);
  if (error) {
    if (error.code === '42703') {
      const fallback = { ...payload };
      delete fallback.phone;
      if (!Object.keys(fallback).length) return null;
      const retry = await supabase.from('profiles').update(fallback).eq('id', currentUser.id);
      if (retry.error) throw retry.error;
      applied = fallback;
    } else {
      throw error;
    }
  }
  const baseProfile = appState.profile || { id: currentUser.id };
  appState.profile = { ...baseProfile, ...applied };
  if (transientProfile && transientProfile.id === currentUser.id) {
    transientProfile = { ...transientProfile, ...applied };
  }
  renderProfile();
  return applied;
}

function normalizeMessage(raw) {
  if (!raw) return raw;
  const msg = { ...raw };
  let text = msg.content || '';
  if (text && text.startsWith(MESSAGE_JSON_PREFIX)) {
    try {
      const payload = JSON.parse(atob(text.slice(MESSAGE_JSON_PREFIX.length)));
      if (payload && typeof payload === 'object') {
        if (typeof payload.text === 'string') msg.content = payload.text;
        if (typeof payload.image_url === 'string') msg.image_url = payload.image_url;
      }
    } catch (_error) {
      // no-op
    }
  }
  return msg;
}

function setAuthMessage(element, message) {
  if (!element) return;
  if (message) {
    element.hidden = false;
    element.textContent = message;
  } else {
    element.hidden = true;
    element.textContent = '';
  }
}

function selectAuthTab(tab) {
  if (tab === 'login') {
    registerForm.hidden = true;
    loginForm.hidden = false;
    loginEmail.focus();
  } else {
    loginForm.hidden = true;
    registerForm.hidden = false;
    registerEmail.focus();
  }
}

function showAuth(show) {
  if (!authOverlay || authOverlayRemoved) return;
  authOverlay.hidden = !show;
  if (show) {
    document.body.classList.add('auth-open');
  } else {
    document.body.classList.remove('auth-open');
  }
}

function destroyAuthOverlay() {
  if (!authOverlay || authOverlayRemoved) return;
  authOverlayRemoved = true;
  authOverlay.remove();
}

function updateNav(screen) {
  navButtons.forEach((button) => {
    const active = button.dataset.screen === screen;
    button.classList.toggle('active', active);
    if (active) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  });
}

function setButtonLoading(button, loading, loadingLabel) {
  if (!button) return;
  if (loading) {
    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = button.textContent.trim();
    }
    button.textContent = loadingLabel;
    button.disabled = true;
  } else {
    const original = button.dataset.originalLabel;
    if (original) button.textContent = original;
    button.disabled = false;
    delete button.dataset.originalLabel;
  }
}

function showSnackbar(message) {
  snackbarEl.textContent = message;
  snackbarEl.classList.add('visible');
  clearTimeout(snackbarTimer);
  snackbarTimer = setTimeout(() => {
    snackbarEl.classList.remove('visible');
  }, 2400);
}

function applyTheme(preference) {
  if (preference === 'system') {
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.dataset.theme = prefersDark ? 'dark' : 'light';
  } else {
    document.body.dataset.theme = preference;
  }
  appState.themePreference = preference;
  persistPrefs();
}

function updateEngagementToggleUI() {
  if (engagementToggle) {
    engagementToggle.checked = appState.engagementMode === 'slider';
  }
  if (engagementToggleLabel) {
    engagementToggleLabel.textContent = appState.engagementMode === 'slider' ? 'On' : 'Off';
  }
}

function setEngagementMode(mode) {
  appState.engagementMode = mode === 'slider' ? 'slider' : 'likes';
  updateEngagementToggleUI();
  persistPrefs();
  renderFeed();
}

function resetAppState() {
  appState.posts = [];
  appState.postMeta = {};
  appState.searchUsers = [];
  appState.searchPosts = [];
  appState.friends = [];
  appState.friendRequests = { incoming: [], outgoing: [] };
  appState.conversations = {};
  appState.profile = null;
  appState.myPosts = [];
  appState.feedLoaded = false;
  appState.friendsLoaded = false;
  appState.friendRequestsLoaded = false;
  appState.profileLoaded = false;
  appState.comments = {};
  externalPostsCache.clear();
  transientProfile = null;
  activeChat = null;
  profileRelation = { status: 'self', requestId: null };
  profileRelationTarget = null;
  activeCommentsPost = null;
  if (commentsOverlay) {
    commentsOverlay.classList.remove('open');
    commentsOverlay.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('modal-open');

  feedList.innerHTML = '';

  searchResults.innerHTML = '';
  searchLoading.hidden = true;

  friendsList.innerHTML = '';
  friendsLoading.hidden = false;
  friendsLoading.textContent = 'Sign in to view your friends.';
  chatCard.hidden = true;
  messagesList.innerHTML = '';
  msgInput.value = '';
  if (profileFriendActions) {
    profileFriendActions.hidden = true;
    profileFriendActions.innerHTML = '';
  }
  if (profilePhoneEl) {
    profilePhoneEl.hidden = true;
    profilePhoneEl.textContent = '';
  }
  if (profileFriendsList) profileFriendsList.innerHTML = '';
  if (profileFriendsEmpty) profileFriendsEmpty.hidden = false;
  if (profileFriendRequestsCard) profileFriendRequestsCard.hidden = true;
  if (profileFriendRequestsIncoming) profileFriendRequestsIncoming.innerHTML = '';
  if (profileFriendRequestsOutgoing) profileFriendRequestsOutgoing.innerHTML = '';
  if (profileFriendRequestsIncomingWrapper) profileFriendRequestsIncomingWrapper.hidden = true;
  if (profileFriendRequestsOutgoingWrapper) profileFriendRequestsOutgoingWrapper.hidden = true;
  if (profileFriendRequestsEmpty) {
    profileFriendRequestsEmpty.hidden = false;
    profileFriendRequestsEmpty.textContent = 'No pending requests.';
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function escapeAttr(value) {
  return String(value ?? '').replace(/"/g, '&quot;');
}

function formatRelative(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < day * 7) return `${Math.floor(diff / day)}d ago`;
  return date.toLocaleDateString();
}

function setAvatar(element, name, src) {
  if (!element) return;
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  element.innerHTML = '';
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `${name || 'Avatar'}`;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';
    img.addEventListener('error', () => {
      element.textContent = initial;
    });
    element.appendChild(img);
  } else {
    element.textContent = initial;
  }
}

function checkPostCreatedFlag() {
  const flag = localStorage.getItem(POST_CREATED_FLAG_KEY);
  if (!flag) return;
  localStorage.removeItem(POST_CREATED_FLAG_KEY);
  if (!currentUser) return;
  ensureFeed(true).catch((error) => console.error('Feed refresh after post failed:', error));
  showSnackbar('Post published.');
}

function handleDeepLinks() {
  try {
    const url = new URL(window.location.href);
    const profileParam = url.searchParams.get('profile');
    if (profileParam && currentUser) {
      openProfileFromSearch(profileParam);
    }
    if (profileParam) {
      url.searchParams.delete('profile');
      window.history.replaceState({}, '', url);
    }
  } catch (_error) {
    // ignore malformed URLs
  }
}

function getCommentState(postId) {
  if (!postId) return { items: [], loaded: false, loading: false, error: null };
  if (!appState.comments[postId]) {
    appState.comments[postId] = { items: [], loaded: false, loading: false, error: null };
  }
  return appState.comments[postId];
}

function normalizeComment(row) {
  if (!row) return null;
  const profile = row.profiles || row.profile || {};
  return {
    id: (row.id ?? '').toString(),
    postId: (row.post_id ?? '').toString(),
    userId: (row.user_id ?? '').toString(),
    username: profile.username || 'Unknown',
    avatarUrl: profile.avatar_url || null,
    content: row.content || '',
    createdAt: row.created_at || new Date().toISOString(),
    replies: Array.isArray(row.replies) ? row.replies : [],
  };
}

function normalizeReply(row) {
  if (!row) return null;
  const profile = row.profiles || row.profile || {};
  return {
    id: (row.id ?? '').toString(),
    commentId: (row.comment_id ?? '').toString(),
    userId: (row.user_id ?? '').toString(),
    username: profile.username || 'Unknown',
    avatarUrl: profile.avatar_url || null,
    content: row.content || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function buildReplyElement(reply) {
  const wrapper = document.createElement('div');
  wrapper.className = 'reply-item';
  const avatar = document.createElement('div');
  avatar.className = 'avatar small';
  setAvatar(avatar, reply.username, reply.avatarUrl);
  const content = document.createElement('div');
  content.className = 'reply-content';
  const meta = document.createElement('div');
  meta.className = 'reply-meta';
  const name = document.createElement('strong');
  name.textContent = reply.username || 'User';
  meta.appendChild(name);
  if (reply.createdAt) {
    const time = document.createElement('span');
    time.textContent = formatRelative(reply.createdAt);
    meta.appendChild(time);
  }
  const text = document.createElement('div');
  text.className = 'reply-text';
  text.textContent = reply.content || '';
  content.appendChild(meta);
  content.appendChild(text);
  wrapper.appendChild(avatar);
  wrapper.appendChild(content);
  return wrapper;
}

function buildCommentElement(comment) {
  const wrapper = document.createElement('div');
  wrapper.className = 'comment-item';
  wrapper.dataset.commentId = comment.id || '';
  if (activeReplyTarget && activeReplyTarget.id === comment.id) {
    wrapper.classList.add('reply-target');
  }

  const avatar = document.createElement('div');
  avatar.className = 'avatar small';
  setAvatar(avatar, comment.username, comment.avatarUrl);

  const main = document.createElement('div');
  main.className = 'comment-main';

  const header = document.createElement('div');
  header.className = 'comment-header';

  const meta = document.createElement('div');
  meta.className = 'comment-meta';
  const name = document.createElement('strong');
  name.textContent = comment.username || 'User';
  meta.appendChild(name);
  if (comment.createdAt) {
    const separator = document.createElement('span');
    separator.className = 'comment-separator';
    separator.textContent = '•';
    meta.appendChild(separator);
    const time = document.createElement('span');
    time.textContent = formatRelative(comment.createdAt);
    meta.appendChild(time);
  }
  header.appendChild(meta);

  const content = document.createElement('div');
  content.className = 'comment-content';
  content.textContent = comment.content || '';

  const footer = document.createElement('div');
  footer.className = 'comment-footer';
  const replyBtn = document.createElement('button');
  replyBtn.type = 'button';
  replyBtn.className = 'comment-reply-btn';
  replyBtn.setAttribute('aria-label', 'Reply to comment');
  if (activeReplyTarget && activeReplyTarget.id === comment.id) {
    replyBtn.classList.add('active');
  }
  replyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M7.41 8.59 5 11h7a6 6 0 0 1 6 6v1a1 1 0 1 1-2 0v-1a4 4 0 0 0-4-4H5l2.41 2.41a1 1 0 0 1-1.42 1.42l-4.12-4.13a1.75 1.75 0 0 1 0-2.48l4.12-4.12a1 1 0 0 1 1.42 1.42Z"></path>
        </svg>
      `;
  replyBtn.addEventListener('click', () => setReplyTarget(comment));
  footer.appendChild(replyBtn);

  main.appendChild(header);
  main.appendChild(content);
  main.appendChild(footer);

  wrapper.appendChild(avatar);
  wrapper.appendChild(main);

  if (Array.isArray(comment.replies) && comment.replies.length) {
    const repliesContainer = document.createElement('div');
    repliesContainer.className = 'comment-replies';
    comment.replies
      .slice()
      .sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
      )
      .forEach((reply) => {
        repliesContainer.appendChild(buildReplyElement(reply));
      });
    wrapper.appendChild(repliesContainer);
  }

  return wrapper;
}

function renderComments(postId) {
  if (!commentsList) return;
  const state = getCommentState(postId);
  commentsList.innerHTML = '';
  if (state.loading) {
    const loadingEl = document.createElement('p');
    loadingEl.className = 'comments-empty';
    loadingEl.textContent = 'Loading comments…';
    commentsList.appendChild(loadingEl);
    return;
  }
  if (state.error) {
    const errorEl = document.createElement('p');
    errorEl.className = 'comments-empty';
    errorEl.textContent = 'Unable to load comments right now.';
    commentsList.appendChild(errorEl);
    return;
  }
  if (!state.items.length) {
    const empty = document.createElement('p');
    empty.className = 'comments-empty';
    empty.textContent = 'No comments yet. Be the first to share your thoughts.';
    commentsList.appendChild(empty);
    return;
  }
  if (activeReplyTarget && !state.items.some((item) => item.id === activeReplyTarget.id)) {
    activeReplyTarget = null;
    applyReplyTargetUI();
  }
  const sorted = state.items
    .slice()
    .sort(
      (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
    );
  sorted.forEach((comment) => {
    commentsList.appendChild(buildCommentElement(comment));
  });
}

async function loadComments(postId, { force = false } = {}) {
  if (!postId) return;
  const state = getCommentState(postId);
  if (state.loading) return;
  if (state.loaded && !force) {
    renderComments(postId);
    return;
  }
  state.loading = true;
  state.error = null;
  renderComments(postId);
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .select('id, post_id, user_id, content, created_at, profiles(username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    const comments = (data || []).map(normalizeComment).filter(Boolean);
    const commentIds = comments.map((comment) => comment.id).filter(Boolean);
    if (commentIds.length) {
      try {
        const { data: repliesData, error: repliesError } = await supabase
          .from('comment_replies')
          .select('id, comment_id, user_id, content, created_at, profiles(username, avatar_url)')
          .in('comment_id', commentIds)
          .order('created_at', { ascending: true });
        if (repliesError) throw repliesError;
        const repliesByComment = new Map();
        (repliesData || [])
          .map(normalizeReply)
          .filter(Boolean)
          .forEach((reply) => {
            const list = repliesByComment.get(reply.commentId) || [];
            list.push(reply);
            repliesByComment.set(reply.commentId, list);
          });
        comments.forEach((comment) => {
          comment.replies = repliesByComment.get(comment.id) || [];
        });
      } catch (replyError) {
        console.error('Replies load failed:', replyError);
        // keep comments without replies
      }
    }
    state.items = comments;
    state.loaded = true;
    const meta = ensurePostMeta(postId);
    const prevCount = meta.comments || 0;
    meta.comments = comments.length;
    if (prevCount !== meta.comments) {
      renderFeed();
    }
  } catch (error) {
    console.error('Comments load failed:', error);
    state.error = error;
  } finally {
    state.loading = false;
    renderComments(postId);
  }
}

function applyReplyTargetUI() {
  if (commentSubmit) {
    commentSubmit.textContent = activeReplyTarget ? 'Send reply' : 'Post comment';
  }
  if (!commentTextarea) return;
  if (!currentUser) {
    if (replyIndicator) replyIndicator.hidden = true;
    return;
  }
  if (activeReplyTarget) {
    const targetName = activeReplyTarget.username || 'this comment';
    if (replyIndicator && replyIndicatorText) {
      replyIndicator.hidden = false;
      replyIndicatorText.textContent = `Replying to ${targetName}`;
    }
    commentTextarea.placeholder = `Reply to ${targetName}…`;
    if (commentSubmit) {
      commentSubmit.disabled = commentTextarea.value.trim().length === 0;
    }
  } else {
    if (replyIndicator) replyIndicator.hidden = true;
    commentTextarea.placeholder = 'Share your thoughts…';
    if (commentSubmit && currentUser) {
      commentSubmit.disabled = commentTextarea.value.trim().length === 0;
    }
  }
}

function clearReplyTarget(skipRender = false) {
  activeReplyTarget = null;
  applyReplyTargetUI();
  if (!skipRender && activeCommentsPost) {
    renderComments(activeCommentsPost.id);
  }
}

function setReplyTarget(comment) {
  if (!currentUser) {
    showSnackbar('Sign in to reply.');
    return;
  }
  if (!comment || !comment.id) return;
  if (activeReplyTarget && activeReplyTarget.id === comment.id) {
    clearReplyTarget();
    return;
  }
  activeReplyTarget = {
    id: comment.id,
    username: comment.username || 'this comment',
  };
  applyReplyTargetUI();
  if (activeCommentsPost) {
    renderComments(activeCommentsPost.id);
  }
  if (commentTextarea) {
    commentTextarea.focus();
  }
}

function updateCommentsInputState() {
  if (!commentsInputSection || !commentsSigninHint) return;
  const signedIn = Boolean(currentUser);
  if (signedIn) {
    if (commentForm) commentForm.hidden = false;
    commentsSigninHint.hidden = true;
    if (commentTextarea) {
      commentTextarea.disabled = false;
      if (commentSubmit) {
        commentSubmit.disabled = commentTextarea.value.trim().length === 0;
      }
    }
    applyReplyTargetUI();
  } else {
    activeReplyTarget = null;
    applyReplyTargetUI();
    if (commentForm) commentForm.hidden = true;
    commentsSigninHint.hidden = false;
    if (commentTextarea) {
      commentTextarea.disabled = true;
      commentTextarea.value = '';
      commentTextarea.setAttribute('placeholder', 'Sign in to comment…');
    }
    if (commentSubmit) {
      commentSubmit.disabled = true;
    }
    if (replyIndicator) replyIndicator.hidden = true;
  }
}

function updateCommentsPreview(post) {
  if (!commentsPostPreview) return;
  commentsPostPreview.innerHTML = '';
  if (!post) {
    commentsPostPreview.hidden = true;
    return;
  }
  commentsPostPreview.hidden = false;
  const avatar = document.createElement('div');
  avatar.className = 'avatar medium';
  setAvatar(avatar, post.username, post.avatarUrl);

  const main = document.createElement('div');
  main.className = 'comment-main';
  const header = document.createElement('div');
  header.className = 'comment-header';
  const meta = document.createElement('div');
  meta.className = 'comment-meta';
  const name = document.createElement('strong');
  name.textContent = post.username || 'Unknown';
  meta.appendChild(name);
  const separator = document.createElement('span');
  separator.className = 'comment-separator';
  separator.textContent = '•';
  meta.appendChild(separator);
  const time = document.createElement('span');
  time.textContent = formatRelative(post.createdAt);
  meta.appendChild(time);
  header.appendChild(meta);
  const content = document.createElement('div');
  content.className = 'comment-content';
  if (post.content) {
    content.textContent = post.content;
  } else if (post.imageUrl) {
    content.textContent = 'Shared a photo.';
  } else {
    content.textContent = 'Shared an update.';
  }
  main.appendChild(header);
  main.appendChild(content);
  commentsPostPreview.appendChild(avatar);
  commentsPostPreview.appendChild(main);
}

function openComments(post) {
  if (!post) return;
  activeCommentsPost = post;
  clearReplyTarget(true);
  updateCommentsPreview(post);
  if (commentsModalSubtitle) {
    const relative = formatRelative(post.createdAt);
    commentsModalSubtitle.textContent = `by ${post.username || 'Unknown'} • ${relative}`;
  }
  if (commentsOverlay) {
    commentsOverlay.classList.add('open');
    commentsOverlay.setAttribute('aria-hidden', 'false');
  }
  document.body.classList.add('modal-open');
  updateCommentsInputState();
  renderComments(post.id);
  loadComments(post.id);
  if (commentTextarea && currentUser) {
    commentTextarea.value = '';
    if (commentSubmit) commentSubmit.disabled = true;
    commentTextarea.focus();
  } else if (commentTextarea && !currentUser) {
    commentTextarea.value = '';
  }
}

function closeComments() {
  activeCommentsPost = null;
  if (commentsOverlay) {
    commentsOverlay.classList.remove('open');
    commentsOverlay.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('modal-open');
  clearReplyTarget(true);
  if (commentTextarea) {
    commentTextarea.value = '';
  }
}

function currentDisplayName() {
  return (
    appState.profile?.username ||
    currentUser?.user_metadata?.username ||
    currentUser?.email ||
    'You'
  );
}

async function handleCommentSubmit(postId, text) {
  const state = getCommentState(postId);
  const optimistic = {
    id: `local-${Date.now()}`,
    postId,
    userId: currentUser.id,
    username: currentDisplayName(),
    avatarUrl: appState.profile?.avatar_url || null,
    content: text,
    createdAt: new Date().toISOString(),
    replies: [],
  };
  state.items.push(optimistic);
  state.loaded = true;
  renderComments(postId);
  const meta = ensurePostMeta(postId);
  meta.comments = (meta.comments || 0) + 1;
  renderFeed();
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: currentUser.id,
        content: text,
      })
      .select('id, post_id, user_id, content, created_at, profiles(username, avatar_url)')
      .single();
    if (error) throw error;
    const mapped = normalizeComment(data);
    if (mapped) {
      const index = state.items.findIndex((item) => item.id === optimistic.id);
      if (index !== -1) {
        state.items.splice(index, 1, mapped);
      } else {
        state.items.push(mapped);
      }
    }
    return true;
  } catch (error) {
    console.error('Comment submit failed:', error);
    showSnackbar(error?.message || 'Failed to post comment.');
    state.items = state.items.filter((item) => item.id !== optimistic.id);
    const metaAfter = ensurePostMeta(postId);
    metaAfter.comments = Math.max(0, (metaAfter.comments || 1) - 1);
    renderFeed();
    return false;
  } finally {
    renderComments(postId);
  }
}

async function handleReplySubmit(postId, commentId, text) {
  const state = getCommentState(postId);
  const target = state.items.find((item) => item.id === commentId);
  if (!target) {
    showSnackbar('Original comment is no longer available.');
    return false;
  }
  target.replies = target.replies || [];
  const optimistic = {
    id: `local-reply-${Date.now()}`,
    commentId,
    userId: currentUser.id,
    username: currentDisplayName(),
    avatarUrl: appState.profile?.avatar_url || null,
    content: text,
    createdAt: new Date().toISOString(),
  };
  target.replies.push(optimistic);
  renderComments(postId);
  try {
    const { data, error } = await supabase
      .from('comment_replies')
      .insert({
        comment_id: commentId,
        user_id: currentUser.id,
        content: text,
      })
      .select('id, comment_id, user_id, content, created_at, profiles(username, avatar_url)')
      .single();
    if (error) throw error;
    const mapped = normalizeReply(data);
    if (mapped) {
      const index = target.replies.findIndex((reply) => reply.id === optimistic.id);
      if (index !== -1) {
        target.replies.splice(index, 1, mapped);
      } else {
        target.replies.push(mapped);
      }
    }
    return true;
  } catch (error) {
    console.error('Reply submit failed:', error);
    showSnackbar(error?.message || 'Failed to send reply.');
    target.replies = target.replies.filter((reply) => reply.id !== optimistic.id);
    return false;
  } finally {
    renderComments(postId);
  }
}

async function submitComment(event) {
  event.preventDefault();
  if (!currentUser) {
    showSnackbar('Sign in to comment.');
    return;
  }
  if (!activeCommentsPost) return;
  const text = commentTextarea?.value?.trim();
  if (!text) return;
  const postId = activeCommentsPost.id;
  const isReply = Boolean(activeReplyTarget && activeReplyTarget.id);
  if (isReply && replyInFlight) return;

  setButtonLoading(commentSubmit, true, isReply ? 'Replying…' : 'Posting…');
  commentTextarea.disabled = true;

  let success = false;
  try {
    if (isReply && activeReplyTarget) {
      replyInFlight = true;
      success = await handleReplySubmit(postId, activeReplyTarget.id, text);
    } else {
      success = await handleCommentSubmit(postId, text);
    }
  } finally {
    replyInFlight = false;
  }

  if (success) {
    commentTextarea.value = '';
    if (isReply) {
      clearReplyTarget();
    }
  }

  setButtonLoading(commentSubmit, false);
  commentTextarea.disabled = false;
  if (commentSubmit && currentUser) {
    commentSubmit.disabled = commentTextarea.value.trim().length === 0;
  } else if (commentSubmit) {
    commentSubmit.disabled = true;
  }
  applyReplyTargetUI();
  if (currentUser) {
    commentTextarea.focus();
  }
}

function mapPost(row) {
  const profile = row.profiles ?? {};
  if (profile.banned) return null;
  return {
    id: row.id,
    userId: row.user_id,
    authorId: row.user_id,
    username: profile.username || 'Unknown',
    avatarUrl: profile.avatar_url || null,
    content: row.content || '',
    imageUrl: row.image_url || '',
    createdAt: row.created_at,
  };
}

async function applyRecommended(posts) {
  if (!currentUser) return posts;
  try {
    const reactionsPromise = supabase
      .from('post_reactions')
      .select('reaction, posts(user_id)')
      .eq('user_id', currentUser.id);
    const viewsPromise = supabase
      .from('post_views')
      .select('posts(user_id)')
      .eq('user_id', currentUser.id);
    const [reactionsRes, viewsRes] = await Promise.all([reactionsPromise, viewsPromise]);
    if (reactionsRes.error) throw reactionsRes.error;
    if (viewsRes.error) throw viewsRes.error;
    const prefs = new Map();
    (reactionsRes.data || []).forEach((row) => {
      const post = row.posts || {};
      const authorId = post.user_id;
      if (!authorId) return;
      const reaction = row.reaction;
      const current = prefs.get(authorId) || 0;
      if (reaction === 'like') prefs.set(authorId, current + 1);
      else if (reaction === 'dislike') prefs.set(authorId, current - 1);
    });
    const viewsByAuthor = new Map();
    (viewsRes.data || []).forEach((row) => {
      const post = row.posts || {};
      const authorId = post.user_id;
      if (!authorId) return;
      viewsByAuthor.set(authorId, (viewsByAuthor.get(authorId) || 0) + 1);
    });
    const filtered = posts.filter((post) => {
      const score = prefs.get(post.authorId) || 0;
      const views = viewsByAuthor.get(post.authorId) || 0;
      if (views >= 9 && score < 0) return false;
      return true;
    });
    filtered.sort((a, b) => {
      const aScore = prefs.get(a.authorId) || 0;
      const bScore = prefs.get(b.authorId) || 0;
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return filtered;
  } catch (error) {
    console.error('Recommended feed failed:', error);
    return posts;
  }
}

async function fetchPostMeta(postIds) {
  const meta = {};
  const likeSets = {};
  const dislikeSets = {};
  postIds.forEach((id) => {
    meta[id] = {
      likes: 0,
      dislikes: 0,
      comments: 0,
      myReaction: ensurePostMeta(id).myReaction ?? null,
    };
    likeSets[id] = new Set();
    dislikeSets[id] = new Set();
  });
  if (!postIds.length) return meta;
  try {
    const promises = [
      supabase
        .from('post_reactions')
        .select('post_id, user_id, reaction')
        .in('post_id', postIds),
      supabase
        .from('post_comments')
        .select('post_id')
        .in('post_id', postIds),
    ];
    const [reactionsRes, commentsRes] = await Promise.all(promises);
    if (!reactionsRes.error && Array.isArray(reactionsRes.data)) {
      (reactionsRes.data || []).forEach((row) => {
        const postId = row.post_id;
        if (!meta[postId]) meta[postId] = ensurePostMeta(postId);
        const reaction = (row.reaction || '').toString();
        if (reaction === 'like') likeSets[postId]?.add(row.user_id);
        else if (reaction === 'dislike') dislikeSets[postId]?.add(row.user_id);
        if (currentUser && row.user_id === currentUser.id) {
          meta[postId].myReaction = reaction || null;
        }
      });
    }
    if (!commentsRes.error) {
      (commentsRes.data || []).forEach((row) => {
        const postId = row.post_id;
        if (!meta[postId]) meta[postId] = ensurePostMeta(postId);
        meta[postId].comments += 1;
      });
    }
  } catch (error) {
    console.error('Post meta fetch failed:', error);
  }
  Object.entries(meta).forEach(([postId, entry]) => {
    entry.likes = likeSets[postId]?.size ?? entry.likes ?? 0;
    entry.dislikes = dislikeSets[postId]?.size ?? entry.dislikes ?? 0;
  });
  return meta;
}

async function toggleReaction(postId, reaction) {
  if (!currentUser) {
    showSnackbar('Sign in to react to posts.');
    return;
  }
  const meta = ensurePostMeta(postId);
  const snapshot = { ...meta };
  const previous = meta.myReaction;
  const next = previous === reaction ? null : reaction;
  if (previous === 'like') meta.likes = Math.max(0, meta.likes - 1);
  if (previous === 'dislike') meta.dislikes = Math.max(0, meta.dislikes - 1);
  if (next === 'like') meta.likes += 1;
  if (next === 'dislike') meta.dislikes += 1;
  meta.myReaction = next;
  renderFeed();
  try {
    await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', currentUser.id);
    if (next) {
      const { error } = await supabase
        .from('post_reactions')
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          reaction: next,
        })
        .select()
        .single();
      if (error) throw error;
    }
  } catch (error) {
    console.error('Reaction update failed:', error);
    appState.postMeta[postId] = snapshot;
    renderFeed();
    showSnackbar(error?.message || 'Failed to update reaction.');
    return;
  }
  showSnackbar(
    next
      ? next === 'like'
        ? 'You liked this post.'
        : 'You disliked this post.'
      : 'Reaction removed.',
  );
}

async function loadFeed() {
  feedList.innerHTML = '';
  if (!currentUser) {
    return;
  }
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, content, image_url, created_at, user_id, profiles(username, avatar_url, banned)')
      .order('created_at', { ascending: false })
      .limit(40);
    if (error) throw error;
    const mapped = (data || []).map(mapPost).filter(Boolean);
    const posts =
      appState.feedMode === 'recommended' ? await applyRecommended(mapped) : mapped;
    appState.posts = posts;
    const postIds = posts.map((post) => post.id).filter(Boolean);
    appState.postMeta = await fetchPostMeta(postIds);
    renderFeed();
  } catch (error) {
    console.error('Feed load failed:', error);
    showSnackbar('Feed failed to load.');
  } finally {
    appState.feedLoaded = true;
  }
}

function renderFeed() {
  feedList.innerHTML = '';
  if (!appState.posts.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = currentUser
      ? 'No posts yet. Follow friends or share something new.'
      : 'Sign in to see the feed.';
    feedList.appendChild(empty);
    return;
  }
  const useSlider = appState.engagementMode === 'slider';
  appState.posts.forEach((post) => {
    const meta = ensurePostMeta(post.id);
    const article = document.createElement('article');
    article.className = 'card post-card';
    const header = document.createElement('header');
    header.className = 'post-header';
    const avatarEl = document.createElement('div');
    avatarEl.className = 'avatar small';
    setAvatar(avatarEl, post.username, post.avatarUrl);
    const metaWrapper = document.createElement('div');
    metaWrapper.className = 'post-meta';
    const nameEl = document.createElement('strong');
    nameEl.textContent = post.username || 'Unknown';
    const timeEl = document.createElement('span');
    timeEl.className = 'muted small';
    timeEl.textContent = formatRelative(post.createdAt);
    metaWrapper.appendChild(nameEl);
    metaWrapper.appendChild(timeEl);
    header.appendChild(avatarEl);
    header.appendChild(metaWrapper);
    article.appendChild(header);

    if (post.content) {
      const content = document.createElement('div');
      content.className = 'post-content';
      content.textContent = post.content;
      article.appendChild(content);
    }

    if (post.imageUrl) {
      const img = document.createElement('img');
      img.className = 'post-image';
      img.alt = 'Post image';
      img.src = post.imageUrl;
      article.appendChild(img);
    }

    const footer = document.createElement('footer');
    footer.className = 'post-actions';

    if (useSlider) {
      const sliderRow = document.createElement('div');
      sliderRow.className = 'slider-row';
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '1';
      slider.max = '10';
      slider.step = '1';
      slider.value = String(getSliderRating(post.id));
      slider.disabled = !currentUser;
      const sliderValue = document.createElement('span');
      sliderValue.className = 'reaction-count';
      sliderValue.textContent = `Rating: ${slider.value}`;
      slider.addEventListener('input', () => {
        sliderValue.textContent = `Rating: ${slider.value}`;
      });
      slider.addEventListener('change', () => {
        if (!currentUser) {
          showSnackbar('Sign in to rate posts.');
          slider.value = String(getSliderRating(post.id));
          sliderValue.textContent = `Rating: ${slider.value}`;
          return;
        }
        const stored = setSliderRating(post.id, Number(slider.value));
        slider.value = String(stored);
        sliderValue.textContent = `Rating: ${stored}`;
        showSnackbar('Saved slider rating.');
      });
      sliderRow.appendChild(slider);
      sliderRow.appendChild(sliderValue);
      footer.appendChild(sliderRow);
    } else {
      const reactionsRow = document.createElement('div');
      reactionsRow.className = 'reaction-group';
      reactionsRow.setAttribute('role', 'group');

      const likeIsActive = meta.myReaction === 'like';
      const likeBtn = document.createElement('button');
      likeBtn.type = 'button';
      likeBtn.className = `reaction-btn ${likeIsActive ? 'active' : ''}`;
      likeBtn.setAttribute('aria-label', 'Like');
      likeBtn.setAttribute('aria-pressed', likeIsActive ? 'true' : 'false');
      likeBtn.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M1 21h4V9H1v12Zm22-11c0-1.1-.9-2-2-2h-8.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L12.17 2 6.58 7.59c-.36.36-.58.86-.58 1.41V19c0 1.1.9 2 2 2h9.5c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73Z"></path>
            </svg>
            <span class="reaction-count">${meta.likes}</span>
          `;
      likeBtn.addEventListener('click', () => toggleReaction(post.id, 'like'));

      const dislikeIsActive = meta.myReaction === 'dislike';
      const dislikeBtn = document.createElement('button');
      dislikeBtn.type = 'button';
      dislikeBtn.className = `reaction-btn dislike ${dislikeIsActive ? 'active' : ''}`;
      dislikeBtn.setAttribute('aria-label', 'Dislike');
      dislikeBtn.setAttribute('aria-pressed', dislikeIsActive ? 'true' : 'false');
      dislikeBtn.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M15.5 4h-9.5c-.83 0-1.54.5-1.84 1.22L1.14 12.27c-.09.23-.14.47-.14.73V14c0 1.1.9 2 2 2h8.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L11.83 22l5.59-5.59c.36-.36.58-.86.58-1.41V6c0-1.1-.9-2-2-2Zm5.5 0h-4v12h4V4Z"></path>
            </svg>
            <span class="reaction-count">${meta.dislikes}</span>
          `;
      dislikeBtn.addEventListener('click', () => toggleReaction(post.id, 'dislike'));

      reactionsRow.appendChild(likeBtn);
      reactionsRow.appendChild(dislikeBtn);
      footer.appendChild(reactionsRow);
    }

    const commentBtn = document.createElement('button');
    commentBtn.type = 'button';
    commentBtn.className = 'chip';
    commentBtn.setAttribute('aria-label', 'View comments');
    commentBtn.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M5 4h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4.38L12 17.62 9.38 14H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"></path>
          </svg>
          ${meta.comments > 0 ? `Comments (${meta.comments})` : 'Comments'}
        `;
    commentBtn.addEventListener('click', () => openComments(post));

    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'chip';
    shareBtn.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M18 16a3 3 0 0 0-2.4 1.2l-6.2-3.1a3 3 0 0 0 0-2.2l6.2-3.1A3 3 0 1 0 15 7a3 3 0 0 0 .06.59L8.8 10.7a3 3 0 1 0 0 4.6l6.26 3.11A3 3 0 1 0 18 16Z"></path>
          </svg>
          Share
        `;
    shareBtn.addEventListener('click', () => {
      navigator.clipboard?.writeText(location.href).catch(() => {});
      showSnackbar('Post link copied.');
    });

    footer.appendChild(commentBtn);
    footer.appendChild(shareBtn);
    if (currentUser && post.userId === currentUser.id) {
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'chip dislike';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => deletePost(post.id));
      footer.appendChild(deleteBtn);
    }
    article.appendChild(footer);
    feedList.appendChild(article);
  });
}

async function handleExternalPostCreated() {
  await loadFeed();
  await loadMyPosts();
}

async function deletePost(postId) {
  if (!currentUser) {
    showSnackbar('Sign in to manage your posts.');
    return;
  }
  if (!postId) return;
  const confirmed = window.confirm('Delete this post? This cannot be undone.');
  if (!confirmed) return;
  try {
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', currentUser.id);
    if (error) throw error;
    if (data && data.length === 0) {
      showSnackbar('Unable to delete: not your post or already removed.');
    } else {
      showSnackbar('Post deleted');
      await loadFeed();
      await loadMyPosts();
    }
  } catch (error) {
    console.error('Delete post failed:', error);
    showSnackbar(error?.message || 'Failed to delete post.');
  }
}

function renderSearchResults() {
  searchResults.innerHTML = '';
  const { searchUsers, searchPosts } = appState;
  if (!searchUsers.length && !searchPosts.length) {
    const emptyCard = document.createElement('article');
    emptyCard.className = 'card';
    emptyCard.innerHTML = '<p class="muted">No results yet. Try another search term.</p>';
    searchResults.appendChild(emptyCard);
    return;
  }
  if (searchUsers.length) {
    const userCard = document.createElement('article');
    userCard.className = 'card';
    userCard.innerHTML = '<h3>Users</h3>';
    searchUsers.forEach((user, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'list-item';
      const initial = (user.username || '?').trim().charAt(0).toUpperCase() || '?';
      button.innerHTML = `
            <div class="avatar small">${initial}</div>
            <div class="grow">
              <strong>${escapeHtml(user.username || 'Unknown')}</strong>
              <div class="muted small">View profile</div>
            </div>
          `;
      button.addEventListener('click', () => openProfileFromSearch(user.id));
      if (index === searchUsers.length - 1) {
        button.style.borderBottom = 'none';
      }
      userCard.appendChild(button);
    });
    searchResults.appendChild(userCard);
  }
  if (searchPosts.length) {
    const postsCard = document.createElement('article');
    postsCard.className = 'card';
    postsCard.innerHTML = '<h3>Posts</h3>';
    searchPosts.forEach((post, index) => {
      const entry = document.createElement('div');
      entry.className = 'profile-post';
      entry.innerHTML = `
            <strong>${escapeHtml(post.username || 'User')}</strong>
            <div class="muted small">${escapeHtml(post.content || '')}</div>
            <div class="muted small">${formatRelative(post.createdAt)}</div>
          `;
      if (post.imageUrl) {
        entry.innerHTML += `<img class="post-image" src="${escapeAttr(
          post.imageUrl,
        )}" alt="Post image">`;
      }
      if (index === searchPosts.length - 1) {
        entry.style.borderBottom = 'none';
      }
      postsCard.appendChild(entry);
    });
    searchResults.appendChild(postsCard);
  }
}

async function loadSearchResults(query) {
  if (!currentUser) {
    searchLoading.hidden = false;
    searchLoading.textContent = 'Sign in to search.';
    return;
  }
  searchLoading.hidden = false;
  searchLoading.textContent = 'Searching…';
  try {
    const usersPromise = supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${query}%`)
      .neq('id', currentUser.id);
    const postsContentPromise = supabase
      .from('posts')
      .select('id, content, image_url, created_at, user_id, profiles(username, avatar_url, banned)')
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(25);
    const postsAuthorPromise = supabase
      .from('posts')
      .select('id, content, image_url, created_at, user_id, profiles(username, avatar_url, banned)')
      .ilike('profiles.username', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(25);
    const [usersRes, postsContentRes, postsAuthorRes] = await Promise.all([
      usersPromise,
      postsContentPromise,
      postsAuthorPromise,
    ]);
    if (usersRes.error) throw usersRes.error;
    if (postsContentRes.error) throw postsContentRes.error;
    if (postsAuthorRes.error) throw postsAuthorRes.error;
    const users = usersRes.data || [];
    const postsByContent = (postsContentRes.data || []).map(mapPost).filter(Boolean);
    const postsByAuthor = (postsAuthorRes.data || []).map(mapPost).filter(Boolean);
    const postsMap = new Map();
    [...postsByContent, ...postsByAuthor].forEach((post) => {
      if (post) postsMap.set(post.id, post);
    });
    const posts = Array.from(postsMap.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    appState.searchUsers = users;
    appState.searchPosts = posts;
    renderSearchResults();
  } catch (error) {
    console.error('Search failed:', error);
    showSnackbar('Search failed. Please try again.');
  } finally {
    searchLoading.hidden = true;
  }
}

async function fetchFriendProfiles(friendIds) {
  if (!friendIds.length) return new Map();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', friendIds);
    if (error) throw error;
    const map = new Map();
    (data || []).forEach((profile) => {
      map.set(profile.id, profile);
    });
    return map;
  } catch (error) {
    console.error('Friend profiles fetch failed:', error);
    return new Map();
  }
}

async function fetchFriendSummary(friendId, profile) {
  const [lastMessageRes, unreadRes] = await Promise.all([
    supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at, read')
      .or(
        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUser.id})`,
      )
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', currentUser.id)
      .eq('sender_id', friendId)
      .eq('read', false),
  ]);
  if (lastMessageRes.error) {
    console.error('Last message error:', lastMessageRes.error);
  }
  if (unreadRes.error) {
    console.error('Unread count error:', unreadRes.error);
  }
  const lastMessageRaw = (lastMessageRes.data || [])[0] || null;
  const lastMessage = lastMessageRaw ? normalizeMessage(lastMessageRaw) : null;
  let lastMessageText = lastMessage?.content || '';
  if (!lastMessageText && lastMessage?.image_url) {
    lastMessageText = 'Photo';
  } else if (lastMessageText && lastMessage?.image_url) {
    lastMessageText += ' 📷';
  }
  return {
    id: friendId,
    username: profile?.username || 'Friend',
    avatarUrl: profile?.avatar_url || null,
    lastMessage: lastMessageText || 'No messages yet',
    lastMessageAt: lastMessage?.created_at || null,
    unreadCount: unreadRes.count || 0,
  };
}

async function loadFriends() {
  if (!currentUser) return;
  friendsLoading.hidden = false;
  friendsLoading.textContent = 'Loading friends…';
  friendsList.innerHTML = '';
  try {
    const { data, error } = await supabase
      .from('friends')
      .select('requester_id, accepter_id, status')
      .or(`requester_id.eq.${currentUser.id},accepter_id.eq.${currentUser.id}`);
    if (error) throw error;
    const accepted = (data || []).filter((row) => row.status === 'accepted');
    if (!accepted.length) {
      appState.friends = [];
      friendsLoading.hidden = false;
      friendsLoading.textContent = 'No friends yet.';
      activeChat = null;
      chatCard.hidden = true;
      renderProfileFriends(isViewingOwnProfile());
      appState.friendsLoaded = true;
      return;
    }
    const friendIds = Array.from(
      new Set(
        accepted.map((row) =>
          row.requester_id === currentUser.id ? row.accepter_id : row.requester_id,
        ),
      ),
    );
    const profilesMap = await fetchFriendProfiles(friendIds);
    const summaries = await Promise.all(friendIds.map((id) => fetchFriendSummary(id, profilesMap.get(id))));
    summaries.sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });
    appState.friends = summaries;
    renderFriends();
    friendsLoading.hidden = summaries.length > 0;
    if (!summaries.length) {
      friendsLoading.hidden = false;
      friendsLoading.textContent = 'No friends yet.';
    }
    if (!activeChat) {
      chatCard.hidden = true;
    }
    renderProfileFriends(isViewingOwnProfile());
  } catch (error) {
    console.error('Friends load failed:', error);
    friendsLoading.hidden = false;
    friendsLoading.textContent = 'Failed to load friends.';
    showSnackbar('Unable to load friends.');
    renderProfileFriends(isViewingOwnProfile());
  } finally {
    appState.friendsLoaded = true;
  }
}

async function loadFriendRequests() {
  if (!currentUser) {
    appState.friendRequests = { incoming: [], outgoing: [] };
    appState.friendRequestsLoaded = false;
    friendRequestsLoading = false;
    renderProfileFriendRequests(false);
    return;
  }
  friendRequestsLoading = true;
  try {
    const { data, error } = await supabase
      .from('friends')
      .select(
        'id, status, requester_id, accepter_id, requester:requester_id(id, username, avatar_url), accepter:accepter_id(id, username, avatar_url)',
      )
      .eq('status', 'pending')
      .or(`requester_id.eq.${currentUser.id},accepter_id.eq.${currentUser.id}`);
    if (error) throw error;
    const incoming = [];
    const outgoing = [];
    (data || []).forEach((row) => {
      const isOutgoing = row.requester_id === currentUser.id;
      const other = isOutgoing ? row.accepter : row.requester;
      const entry = {
        id: row.id,
        userId: other?.id || null,
        username: other?.username || 'Unknown',
        avatarUrl: other?.avatar_url || '',
      };
      if (isOutgoing) outgoing.push(entry);
      else incoming.push(entry);
    });
    appState.friendRequests = { incoming, outgoing };
  } catch (error) {
    console.error('Friend requests load failed:', error);
    appState.friendRequests = { incoming: [], outgoing: [] };
  } finally {
    friendRequestsLoading = false;
    appState.friendRequestsLoaded = true;
    renderProfileFriendRequests(isViewingOwnProfile());
  }
}

function renderFriends() {
  friendsList.innerHTML = '';
  appState.friends.forEach((friend) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'friend-card';
    button.innerHTML = `
          <div class="avatar small"></div>
          <div class="grow">
            <strong>${escapeHtml(friend.username)}</strong>
            <div class="muted small">${escapeHtml(friend.lastMessage)}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
            ${
              friend.unreadCount > 0
                ? `<span class="badge">${friend.unreadCount}</span>`
                : ''
            }
            <span class="muted small">${friend.lastMessageAt ? formatRelative(friend.lastMessageAt) : ''}</span>
          </div>
        `;
    button.addEventListener('click', () => openChat(friend));
    setAvatar(button.querySelector('.avatar'), friend.username, friend.avatarUrl);
    friendsList.appendChild(button);
  });
}

async function loadConversation(friendId) {
  if (!currentUser) return [];
  const pageSize = 250;
  const chunks = [];
  try {
    let from = 0;
    while (true) {
      const query = supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content, created_at, read')
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUser.id})`,
        )
        .order('created_at', { ascending: true })
        .range(from, from + pageSize - 1);
      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) break;
      chunks.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
  } catch (error) {
    console.error('Conversation load failed:', error);
    showSnackbar('Failed to load conversation.');
    const fallback = readLocalMessages(currentUser.id, friendId).map(normalizeMessage);
    appState.conversations[friendId] = fallback;
    return fallback;
  }

  const supabaseMessages = chunks.map(normalizeMessage);
  const localMessages = readLocalMessages(currentUser.id, friendId).map(normalizeMessage);
  const conversation = mergeMessages(supabaseMessages, localMessages);
  writeLocalMessages(currentUser.id, friendId, conversation);
  appState.conversations[friendId] = conversation;
  return conversation;
}

function renderChat() {
  messagesList.innerHTML = '';
  if (!activeChat) {
    const muted = document.createElement('p');
    muted.className = 'muted centered';
    muted.textContent = 'Select a friend to start chatting.';
    messagesList.appendChild(muted);
    return;
  }
  const conversation = appState.conversations[activeChat] || [];
  if (!conversation.length) {
    const empty = document.createElement('p');
    empty.className = 'muted centered';
    empty.textContent = 'No messages yet. Say hello!';
    messagesList.appendChild(empty);
  } else {
    conversation.forEach((message) => {
      const bubble = document.createElement('div');
      const mine = message.sender_id === currentUser.id;
      bubble.className = `msg ${mine ? 'me' : 'you'}`;
      if (message.image_url) {
        const img = document.createElement('img');
        img.src = message.image_url;
        img.alt = 'Message image';
        img.style.maxWidth = '100%';
        img.style.borderRadius = '12px';
        img.style.marginBottom = message.content ? '6px' : '0';
        bubble.appendChild(img);
      }
      if (message.content) {
        const text = document.createElement('div');
        text.textContent = message.content;
        bubble.appendChild(text);
      }
      messagesList.appendChild(bubble);
    });
  }
  messagesList.scrollTop = messagesList.scrollHeight;
}

async function markConversationRead(friendId) {
  if (!currentUser) return;
  try {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', friendId)
      .eq('receiver_id', currentUser.id)
      .eq('read', false);
    const conversation = appState.conversations[friendId] || [];
    conversation.forEach((message) => {
      if (message.sender_id === friendId) message.read = true;
    });
    appState.friends = appState.friends.map((friend) =>
      friend.id === friendId ? { ...friend, unreadCount: 0 } : friend,
    );
    renderFriends();
  } catch (error) {
    console.error('Mark read failed:', error);
  }
}

async function openChat(friend) {
  activeChat = friend.id;
  chatUsername.textContent = friend.username || 'Friend';
  const initialSubtitle = friend.lastMessageAt
    ? `Last message ${formatRelative(friend.lastMessageAt)}`
    : 'No messages yet';
  chatSubtitle.textContent = initialSubtitle;
  setAvatar(chatAvatar, friend.username, friend.avatarUrl);
  chatCard.hidden = false;
  resetChatAttachment();
  messagesList.innerHTML = '<p class="muted centered">Loading conversation…</p>';
  await loadConversation(friend.id);
  const conversation = appState.conversations[friend.id] || [];
  if (conversation.length) {
    const lastMessage = conversation[conversation.length - 1];
    chatSubtitle.textContent = `Last message ${formatRelative(lastMessage.created_at)}`;
  } else {
    chatSubtitle.textContent = 'No messages yet';
  }
  renderChat();
  msgInput.focus();
  await markConversationRead(friend.id);
}

async function sendMessage() {
  if (!currentUser || !activeChat) return;
  const text = msgInput.value.trim();
  const hasImage = Boolean(chatAttachmentFile);
  if (!text && !hasImage) return;

  let uploadedUrl = null;
  if (hasImage) {
    try {
      uploadedUrl = await uploadChatImage(chatAttachmentFile, currentUser.id);
    } catch (error) {
      console.error('Image upload failed:', error);
      showSnackbar(error?.message || 'Failed to upload image.');
      return;
    }
  }

  const optimistic = {
    id: `local-${Date.now()}`,
    sender_id: currentUser.id,
    receiver_id: activeChat,
    content: text,
    image_url: uploadedUrl,
    created_at: new Date().toISOString(),
    read: true,
  };
  const conversation = appState.conversations[activeChat] || [];
  conversation.push(optimistic);
  appState.conversations[activeChat] = conversation;
  chatSubtitle.textContent = `Last message ${formatRelative(optimistic.created_at)}`;
  renderChat();
  msgInput.value = '';
  resetChatAttachment();

  let persistedMessage = null;
  try {
    const insertPayload = {
      sender_id: currentUser.id,
      receiver_id: activeChat,
      content: text,
      ...(uploadedUrl ? { image_url: uploadedUrl } : {}),
    };
    const { data, error } = await supabase
      .from('messages')
      .insert(insertPayload)
      .select()
      .single();
    if (error) {
      const missingColumn =
        uploadedUrl &&
        (error.code === '42703' ||
          (typeof error.message === 'string' && error.message.includes('image_url')));
      if (missingColumn) {
        const encoded =
          MESSAGE_JSON_PREFIX + btoa(JSON.stringify({ text, image_url: uploadedUrl }));
        const fallbackPayload = {
          sender_id: currentUser.id,
          receiver_id: activeChat,
          content: encoded,
        };
        const fallback = await supabase.from('messages').insert(fallbackPayload).select().single();
        if (fallback.error) throw fallback.error;
        const normalized = normalizeMessage(fallback.data);
        const index = conversation.findIndex((item) => item.id === optimistic.id);
        if (index !== -1) conversation.splice(index, 1, normalized);
        persistedMessage = normalized;
      } else {
        throw error;
      }
    } else {
      const normalized = normalizeMessage(data);
      const index = conversation.findIndex((item) => item.id === optimistic.id);
      if (index !== -1) conversation.splice(index, 1, normalized);
      persistedMessage = normalized;
    }
    appState.conversations[activeChat] = conversation;
    renderChat();
    if (conversation.length) {
      const latest = conversation[conversation.length - 1];
      chatSubtitle.textContent = `Last message ${formatRelative(latest.created_at)}`;
    }
    await loadFriends();
    if (persistedMessage) {
      storeLocalMessage(currentUser.id, activeChat, persistedMessage);
    }
    await loadConversation(activeChat);
  } catch (error) {
    console.error('Send message failed:', error);
    showSnackbar('Failed to send message.');
    const conv = appState.conversations[activeChat] || [];
    appState.conversations[activeChat] = conv.filter((m) => m.id !== optimistic.id);
    renderChat();
  }
}

async function loadProfile() {
  if (!currentUser) return;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, phone, avatar_url')
      .eq('id', currentUser.id)
      .maybeSingle();
    if (error) throw error;
    appState.profile = data || {
      id: currentUser.id,
      username: currentUser.email || 'You',
      email: currentUser.email || '',
      phone: null,
      avatar_url: null,
    };
  } catch (error) {
    console.error('Profile load failed:', error);
    appState.profile = {
      id: currentUser.id,
      username: currentUser.email || 'You',
      email: currentUser.email || '',
      phone: null,
      avatar_url: null,
    };
  }
}

async function loadMyPosts() {
  if (!currentUser) return;
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, content, image_url, created_at')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    appState.myPosts = (data || []).map((row) => ({
      id: row.id,
      content: row.content || '',
      imageUrl: row.image_url || '',
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('My posts load failed:', error);
    appState.myPosts = [];
  }
}

async function loadExternalProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, phone, avatar_url')
      .eq('id', userId)
      .maybeSingle();
    if (!error && data) {
      transientProfile = data;
    }
  } catch (error) {
    console.error('External profile load failed:', error);
  }
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, content, image_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    externalPostsCache.set(userId, data || []);
  } catch (error) {
    console.error('External posts load failed:', error);
    externalPostsCache.set(userId, []);
  }
  renderProfile();
}

function renderProfile() {
  const profile = transientProfile || appState.profile;
  const userId = profile?.id || null;
  const isOwnProfile = Boolean(profile && currentUser && userId === currentUser.id);
  const posts = transientProfile ? externalPostsCache.get(userId) || [] : appState.myPosts;

  const displayName = profile?.username || (transientProfile ? 'Loading…' : 'You');
  const displayEmail = profile?.email || (transientProfile ? '' : currentUser?.email || '');
  const displayPhone = profile?.phone || '';

  profileUsernameEl.textContent = displayName;
  profileEmailEl.textContent = displayEmail;
  if (profilePhoneEl) {
    if (displayPhone) {
      profilePhoneEl.hidden = false;
      profilePhoneEl.textContent = displayPhone;
    } else {
      profilePhoneEl.hidden = true;
      profilePhoneEl.textContent = '';
    }
  }
  setAvatar(
    profileAvatar,
    profile?.username || profile?.email || currentUser?.email || '?',
    profile?.avatar_url || null,
  );

  logoutBtn.hidden = !isOwnProfile;

  if (userId && !isOwnProfile) {
    if (profileRelationTarget !== userId) {
      profileRelationTarget = userId;
      profileRelation = { status: 'loading', requestId: null };
      renderProfileFriendActions(userId, false);
      refreshProfileRelation(userId);
    } else {
      renderProfileFriendActions(userId, false);
    }
  } else {
    profileRelationTarget = currentUser?.id || null;
    profileRelation = { status: 'self', requestId: null };
    renderProfileFriendActions(userId, true);
  }

  renderProfileFriends(isOwnProfile);
  renderProfileFriendRequests(isOwnProfile);
  if (profileAdminCard) {
    const allowAdmin = Boolean(isOwnProfile && currentUser && isDevUser(currentUser.id));
    profileAdminCard.hidden = !allowAdmin;
    profileAdminCard.setAttribute('aria-hidden', allowAdmin ? 'false' : 'true');
  }
  if (profileEditActions) profileEditActions.hidden = !isOwnProfile;
  if (profileAvatarChangeBtn) profileAvatarChangeBtn.disabled = !isOwnProfile;
  if (profileUsernameEditBtn) profileUsernameEditBtn.disabled = !isOwnProfile;
  if (profilePhoneEditBtn) profilePhoneEditBtn.disabled = !isOwnProfile;

  myPostsContainer.innerHTML = '';
  if (!posts || !posts.length) {
    const message = document.createElement('p');
    message.className = 'muted';
    message.textContent = transientProfile ? 'No posts yet.' : 'You have not posted yet.';
    myPostsContainer.appendChild(message);
  } else {
    posts.forEach((post) => {
      const entry = document.createElement('div');
      entry.className = 'profile-post';
      entry.innerHTML = `
            <strong>${escapeHtml(post.content || '')}</strong>
            <div class="muted small">${formatRelative(post.createdAt)}</div>
            ${
              post.image_url || post.imageUrl
                ? `<img class="post-image" src="${escapeAttr(
                    post.image_url || post.imageUrl,
                  )}" alt="Post image">`
                : ''
            }
          `;
      if (isOwnProfile) {
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'pill-btn danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deletePost(post.id));
        entry.appendChild(deleteBtn);
      }
      myPostsContainer.appendChild(entry);
    });
  }
}

function renderProfileFriendActions(userId, isOwnProfile) {
  if (!profileFriendActions) return;
  profileFriendActions.innerHTML = '';
  if (!userId || isOwnProfile) {
    profileFriendActions.hidden = true;
    return;
  }
  profileFriendActions.hidden = false;
  const relation =
    profileRelationTarget === userId ? profileRelation : { status: 'loading', requestId: null };

  const status = relation.status;
  if (status === 'loading') {
    const message = document.createElement('span');
    message.className = 'friend-status';
    message.textContent = 'Checking friendship…';
    profileFriendActions.appendChild(message);
    return;
  }

  if (status === 'guest') {
    const message = document.createElement('span');
    message.className = 'friend-status';
    message.textContent = 'Sign in to connect with this user.';
    profileFriendActions.appendChild(message);
    return;
  }

  if (status === 'error') {
    const message = document.createElement('span');
    message.className = 'friend-status';
    message.textContent = relation.message || 'Unable to load friendship status.';
    profileFriendActions.appendChild(message);
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'pill-btn';
    retry.textContent = 'Retry';
    retry.addEventListener('click', () => refreshProfileRelation(userId));
    profileFriendActions.appendChild(retry);
    return;
  }

  if (status === 'none') {
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'pill-btn primary';
    add.textContent = 'Add Friend';
    add.addEventListener('click', () => sendFriendRequest(userId));
    profileFriendActions.appendChild(add);
    return;
  }

  if (status === 'outgoing') {
    const message = document.createElement('span');
    message.className = 'friend-status';
    message.textContent = 'Friend request sent.';
    profileFriendActions.appendChild(message);
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'pill-btn';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => cancelFriendRequest(relation.requestId, userId));
    profileFriendActions.appendChild(cancel);
    return;
  }

  if (status === 'incoming') {
    const message = document.createElement('span');
    message.className = 'friend-status';
    message.textContent = 'This user sent you a friend request.';
    profileFriendActions.appendChild(message);
    const accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'pill-btn primary';
    accept.textContent = 'Accept';
    accept.addEventListener('click', () => acceptFriendRequest(relation.requestId, userId));
    const decline = document.createElement('button');
    decline.type = 'button';
    decline.className = 'pill-btn';
    decline.textContent = 'Decline';
    decline.addEventListener('click', () => declineFriendRequest(relation.requestId, userId));
    profileFriendActions.appendChild(accept);
    profileFriendActions.appendChild(decline);
    return;
  }

  if (status === 'friends') {
    const message = document.createElement('span');
    message.className = 'friend-status';
    message.textContent = 'You are friends.';
    profileFriendActions.appendChild(message);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'pill-btn danger';
    remove.textContent = 'Remove friend';
    remove.addEventListener('click', () => removeFriend(relation.requestId, userId));
    profileFriendActions.appendChild(remove);
    return;
  }

  profileFriendActions.hidden = true;
}

async function refreshProfileRelation(targetId) {
  if (!targetId) return;
  if (!currentUser) {
    profileRelation = { status: 'guest', requestId: null };
    renderProfileFriendActions(targetId, false);
    return;
  }
  if (targetId === currentUser.id) {
    profileRelation = { status: 'self', requestId: null };
    renderProfileFriendActions(targetId, true);
    return;
  }
  profileRelationTarget = targetId;
  profileRelation = { status: 'loading', requestId: null };
  renderProfileFriendActions(targetId, false);
  try {
    const { data, error } = await supabase
      .from('friends')
      .select('id, status, requester_id, accepter_id')
      .or(
        `and(requester_id.eq.${currentUser.id},accepter_id.eq.${targetId}),and(requester_id.eq.${targetId},accepter_id.eq.${currentUser.id})`,
      )
      .maybeSingle();
    if (profileRelationTarget !== targetId) return;
    if (error) throw error;
    if (!data) {
      profileRelation = { status: 'none', requestId: null };
    } else if ((data.status || '').toLowerCase() === 'accepted') {
      profileRelation = { status: 'friends', requestId: data.id };
    } else if ((data.status || '').toLowerCase() === 'pending') {
      if (data.requester_id === currentUser.id) {
        profileRelation = { status: 'outgoing', requestId: data.id };
      } else {
        profileRelation = { status: 'incoming', requestId: data.id };
      }
    } else {
      profileRelation = {
        status: 'error',
        message: `Unknown status: ${data.status}`,
        requestId: data.id,
      };
    }
  } catch (error) {
    if (profileRelationTarget !== targetId) return;
    console.error('Friend relation load failed:', error);
    profileRelation = {
      status: 'error',
      message: error?.message || 'Failed to load friendship status.',
      requestId: null,
    };
  }
  renderProfileFriendActions(targetId, false);
}

async function sendFriendRequest(targetId) {
  if (!currentUser) {
    showSnackbar('Sign in to send friend requests.');
    return;
  }
  profileRelation = { status: 'loading', requestId: null };
  renderProfileFriendActions(targetId, false);
  try {
    const { error } = await supabase.from('friends').insert({
      requester_id: currentUser.id,
      accepter_id: targetId,
      status: 'pending',
    });
    if (error) throw error;
    showSnackbar('Friend request sent.');
    ensureFriendRequests(true).catch((err) =>
      console.error('Friend requests refresh failed:', err),
    );
  } catch (error) {
    console.error('Friend request failed:', error);
    profileRelation = {
      status: 'error',
      message: error?.message || 'Failed to send friend request.',
      requestId: null,
    };
    renderProfileFriendActions(targetId, false);
    return;
  }
  await refreshProfileRelation(targetId);
}

async function cancelFriendRequest(requestId, targetId) {
  if (!requestId) return;
  profileRelation = { status: 'loading', requestId: null };
  renderProfileFriendActions(targetId, false);
  try {
    const { error } = await supabase.from('friends').delete().eq('id', requestId);
    if (error) throw error;
    showSnackbar('Friend request canceled.');
    ensureFriendRequests(true).catch((err) =>
      console.error('Friend requests refresh failed:', err),
    );
  } catch (error) {
    console.error('Cancel friend request failed:', error);
    profileRelation = {
      status: 'error',
      message: error?.message || 'Unable to cancel friend request.',
      requestId,
    };
    renderProfileFriendActions(targetId, false);
    return;
  }
  await refreshProfileRelation(targetId);
}

async function acceptFriendRequest(requestId, targetId) {
  if (!requestId) return;
  profileRelation = { status: 'loading', requestId };
  renderProfileFriendActions(targetId, false);
  try {
    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    if (error) throw error;
    showSnackbar('Friend request accepted.');
    ensureFriends(true).catch((err) => console.error('Friends refresh failed:', err));
    ensureFriendRequests(true).catch((err) =>
      console.error('Friend requests refresh failed:', err),
    );
  } catch (error) {
    console.error('Accept friend request failed:', error);
    profileRelation = {
      status: 'error',
      message: error?.message || 'Unable to accept friend request.',
      requestId,
    };
    renderProfileFriendActions(targetId, false);
    return;
  }
  await refreshProfileRelation(targetId);
}

async function declineFriendRequest(requestId, targetId) {
  if (!requestId) return;
  profileRelation = { status: 'loading', requestId: null };
  renderProfileFriendActions(targetId, false);
  try {
    const { error } = await supabase.from('friends').delete().eq('id', requestId);
    if (error) throw error;
    showSnackbar('Friend request declined.');
    ensureFriendRequests(true).catch((err) =>
      console.error('Friend requests refresh failed:', err),
    );
  } catch (error) {
    console.error('Decline friend request failed:', error);
    profileRelation = {
      status: 'error',
      message: error?.message || 'Unable to decline friend request.',
      requestId,
    };
    renderProfileFriendActions(targetId, false);
    return;
  }
  await refreshProfileRelation(targetId);
}

async function removeFriend(requestId, targetId) {
  if (!requestId) return;
  profileRelation = { status: 'loading', requestId: null };
  renderProfileFriendActions(targetId, false);
  try {
    const { error } = await supabase.from('friends').delete().eq('id', requestId);
    if (error) throw error;
    showSnackbar('Friend removed.');
    ensureFriends(true).catch((err) => console.error('Friends refresh failed:', err));
    ensureFriendRequests(true).catch((err) =>
      console.error('Friend requests refresh failed:', err),
    );
  } catch (error) {
    console.error('Remove friend failed:', error);
    profileRelation = {
      status: 'error',
      message: error?.message || 'Unable to remove friend.',
      requestId,
    };
    renderProfileFriendActions(targetId, false);
    return;
  }
  await refreshProfileRelation(targetId);
}

function renderProfileFriends(isOwnProfile) {
  if (!profileFriendsList || !profileFriendsEmpty) return;
  if (!currentUser) {
    profileFriendsEmpty.hidden = false;
    profileFriendsEmpty.textContent = 'Sign in to view your friends.';
    profileFriendsList.innerHTML = '';
    return;
  }
  if (!isOwnProfile) {
    profileFriendsEmpty.hidden = false;
    profileFriendsEmpty.textContent = 'Friends are only visible on your profile.';
    profileFriendsList.innerHTML = '';
    return;
  }
  const friends = appState.friends || [];
  if (!friends.length) {
    profileFriendsEmpty.hidden = false;
    profileFriendsEmpty.textContent = 'No friends yet.';
    profileFriendsList.innerHTML = '';
    return;
  }
  profileFriendsEmpty.hidden = true;
  profileFriendsList.innerHTML = '';
  friends.forEach((friend) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'friend-card';
    const initial = (friend.username || '?').trim().charAt(0).toUpperCase() || '?';
    button.innerHTML = `
          <div class="avatar small"></div>
          <div class="grow">
            <strong>${escapeHtml(friend.username || 'Friend')}</strong>
            <div class="muted small">${escapeHtml(friend.lastMessage || 'Tap to open chat')}</div>
          </div>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M9 5a1 1 0 0 1 1.6-.8l7 6a1 1 0 0 1 0 1.6l-7 6A1 1 0 0 1 9 17V5Z"></path>
          </svg>
        `;
    if (friend.id) {
      button.addEventListener('click', () => openProfileFromSearch(friend.id));
    }
    setAvatar(button.querySelector('.avatar'), friend.username, friend.avatarUrl);
    profileFriendsList.appendChild(button);
  });
}

function renderProfileFriendRequests(isOwnProfile) {
  if (
    !profileFriendRequestsCard ||
    !profileFriendRequestsEmpty ||
    !profileFriendRequestsIncomingWrapper ||
    !profileFriendRequestsOutgoingWrapper ||
    !profileFriendRequestsIncoming ||
    !profileFriendRequestsOutgoing
  ) {
    return;
  }
  if (!isOwnProfile) {
    profileFriendRequestsCard.hidden = true;
    return;
  }
  profileFriendRequestsCard.hidden = false;
  if (friendRequestsLoading && !appState.friendRequestsLoaded) {
    profileFriendRequestsEmpty.hidden = false;
    profileFriendRequestsEmpty.textContent = 'Loading requests…';
    profileFriendRequestsIncoming.innerHTML = '';
    profileFriendRequestsOutgoing.innerHTML = '';
    profileFriendRequestsIncomingWrapper.hidden = true;
    profileFriendRequestsOutgoingWrapper.hidden = true;
    return;
  }
  const incoming = appState.friendRequests.incoming || [];
  const outgoing = appState.friendRequests.outgoing || [];
  const hasRequests = incoming.length || outgoing.length;
  profileFriendRequestsEmpty.hidden = hasRequests;
  if (!hasRequests) {
    profileFriendRequestsEmpty.textContent = 'No pending requests.';
  }

  profileFriendRequestsIncoming.innerHTML = '';
  profileFriendRequestsOutgoing.innerHTML = '';

  profileFriendRequestsIncomingWrapper.hidden = !incoming.length;
  profileFriendRequestsOutgoingWrapper.hidden = !outgoing.length;

  incoming.forEach((req) => {
    const item = document.createElement('div');
    item.className = 'friend-card';
    item.style.cursor = req.userId ? 'pointer' : 'default';
    item.innerHTML = `
          <div class="avatar small"></div>
          <div class="grow">
            <strong>${escapeHtml(req.username || 'User')}</strong>
            <div class="muted small">Sent you a friend request</div>
          </div>
        `;
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '6px';
    const acceptBtn = document.createElement('button');
    acceptBtn.type = 'button';
    acceptBtn.className = 'pill-btn primary';
    acceptBtn.textContent = 'Accept';
    acceptBtn.addEventListener('click', () => acceptFriendRequest(req.id, req.userId));
    const declineBtn = document.createElement('button');
    declineBtn.type = 'button';
    declineBtn.className = 'pill-btn';
    declineBtn.textContent = 'Decline';
    declineBtn.addEventListener('click', () => declineFriendRequest(req.id, req.userId));
    actions.appendChild(acceptBtn);
    actions.appendChild(declineBtn);
    item.appendChild(actions);
    if (req.userId) {
      item.addEventListener('click', (event) => {
        if (event.target instanceof HTMLElement && event.target.closest('button')) return;
        openProfileFromSearch(req.userId);
      });
    }
    setAvatar(item.querySelector('.avatar'), req.username, req.avatarUrl);
    profileFriendRequestsIncoming.appendChild(item);
  });

  outgoing.forEach((req) => {
    const item = document.createElement('div');
    item.className = 'friend-card';
    item.style.cursor = req.userId ? 'pointer' : 'default';
    item.innerHTML = `
          <div class="avatar small"></div>
          <div class="grow">
            <strong>${escapeHtml(req.username || 'User')}</strong>
            <div class="muted small">Awaiting response</div>
          </div>
        `;
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '6px';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'pill-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => cancelFriendRequest(req.id, req.userId));
    actions.appendChild(cancelBtn);
    item.appendChild(actions);
    if (req.userId) {
      item.addEventListener('click', (event) => {
        if (event.target instanceof HTMLElement && event.target.closest('button')) return;
        openProfileFromSearch(req.userId);
      });
    }
    setAvatar(item.querySelector('.avatar'), req.username, req.avatarUrl);
    profileFriendRequestsOutgoing.appendChild(item);
  });
}

async function ensureFeed(force = false) {
  if (!appState.feedLoaded || force) {
    await loadFeed();
  } else {
    renderFeed();
  }
}

async function ensureFriends(force = false) {
  if (!appState.friendsLoaded || force) {
    await loadFriends();
  } else {
    renderFriends();
    renderProfileFriends(isViewingOwnProfile());
  }
}

async function ensureFriendRequests(force = false) {
  if (!currentUser) return;
  if (!appState.friendRequestsLoaded || force) {
    await loadFriendRequests();
  } else {
    renderProfileFriendRequests(isViewingOwnProfile());
  }
}

async function ensureProfile(force = false) {
  if (!appState.profileLoaded || force) {
    await loadProfile();
    await loadMyPosts();
    appState.profileLoaded = true;
  }
  renderProfile();
}

async function showScreen(screen) {
  if (!screenElements[screen]) return;
  Object.entries(screenElements).forEach(([name, element]) => {
    element.classList.toggle('active', name === screen);
  });
  updateNav(screen);
  appState.lastScreen = screen;
  persistPrefs();
  if (screen === 'feed') {
    await ensureFeed();
  } else if (screen === 'search') {
    searchInput.focus();
  } else if (screen === 'messages') {
    await ensureFriends();
  } else if (screen === 'profile') {
    await ensureProfile();
    await ensureFriendRequests();
  }
}

async function openProfileFromSearch(userId) {
  if (!currentUser) {
    showSnackbar('Sign in to view profiles.');
    return;
  }
  showScreen('profile');
  if (userId === currentUser.id) {
    transientProfile = null;
    await ensureProfile(true);
    await ensureFriendRequests(true);
  } else {
    transientProfile = { id: userId };
    profileRelationTarget = null;
    profileRelation = { status: 'loading', requestId: null };
    renderProfile();
    refreshProfileRelation(userId);
    await loadExternalProfile(userId);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  setAuthMessage(loginError, '');
  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  if (!email || !password) {
    setAuthMessage(loginError, 'Enter your email and password.');
    return;
  }
  setButtonLoading(loginSubmit, true, 'Signing in…');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session) {
      showAuth(false);
      destroyAuthOverlay();
    }
  } catch (error) {
    console.error('Login failed:', error);
    setAuthMessage(loginError, error.message || 'Login failed.');
  } finally {
    setButtonLoading(loginSubmit, false);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  setAuthMessage(registerError, '');
  setAuthMessage(registerSuccess, '');
  registerError.dataset.details = '';
  const email = registerEmail.value.trim();
  const username = registerUsername.value.trim();
  const password = registerPassword.value;
  const confirm = registerConfirm.value;
  const phoneRaw = registerPhone.value.trim();
  const birthdayRaw = registerBirthday.value;
  if (!email || !username || !password || !confirm) {
    setAuthMessage(registerError, 'Please fill all required fields.');
    return;
  }
  if (password !== confirm) {
    setAuthMessage(registerError, 'Passwords do not match.');
    return;
  }
  const phoneDigits = phoneRaw.replace(/[^0-9]/g, '');
  if (phoneRaw && phoneDigits.length < 10) {
    setAuthMessage(registerError, 'Please enter a valid phone number.');
    return;
  }
  if (birthdayRaw) {
    const birthday = new Date(birthdayRaw);
    if (!Number.isNaN(birthday.getTime())) {
      const now = new Date();
      let age = now.getFullYear() - birthday.getFullYear();
      const monthDiff = now.getMonth() - birthday.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthday.getDate())) {
        age -= 1;
      }
      if (age < 13) {
        setAuthMessage(registerError, 'You must be at least 13 years old to create an account.');
        return;
      }
    }
  }
  setButtonLoading(registerSubmit, true, 'Creating account…');
  try {
    const existing = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (existing.error && existing.error.code !== 'PGRST116') throw existing.error;
    if (existing.data) {
      setAuthMessage(registerError, 'Username already taken.');
      setButtonLoading(registerSubmit, false);
      return;
    }
    try {
      const banned = await supabase
        .from('banned_emails')
        .select('email, banned_until')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      if (!banned.error && banned.data) {
        const until = banned.data.banned_until ? new Date(banned.data.banned_until) : null;
        if (!until || until > new Date()) {
          setAuthMessage(registerError, 'This email is not allowed to register.');
          setButtonLoading(registerSubmit, false);
          return;
        }
      }
    } catch (error) {
      if (error.code && error.code !== '42P01') {
        throw error;
      }
    }
    const metadata = {};
    if (birthdayRaw) metadata.birthday = new Date(birthdayRaw).toISOString();
    if (phoneRaw) metadata.phone = phoneRaw;
    const signUpRes = await supabase.auth.signUp({
      email,
      password,
      options: Object.keys(metadata).length ? { data: metadata } : undefined,
    });
    if (signUpRes.error) throw signUpRes.error;
    let newSession = signUpRes.data.session;
    let newUser = signUpRes.data.user;
    if (!newSession) {
      const loginRes = await supabase.auth.signInWithPassword({ email, password });
      if (!loginRes.error) {
        newSession = loginRes.data.session;
        newUser = loginRes.data.user;
      }
    }
    if (newSession && newUser) {
      const profilePayload = {
        id: newUser.id,
        username,
        email,
      };
      if (phoneRaw) profilePayload.phone = phoneRaw;
      let profileRes = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });
      if (profileRes.error && profileRes.error.code === '42703') {
        delete profilePayload.phone;
        profileRes = await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });
      }
      if (profileRes.error) {
        console.error('Profile upsert failed:', profileRes.error);
      }
      setAuthMessage(registerSuccess, 'Registered! You are now signed in.');
      session = newSession;
      currentUser = newUser;
      showAuth(false);
      destroyAuthOverlay();
      showScreen('feed');
      ensureProfile(true).catch((err) => console.error('Profile preload failed:', err));
      ensureFriends(true).catch((err) => console.error('Friends preload failed:', err));
      ensureFriendRequests(true).catch((err) =>
        console.error('Friend requests preload failed:', err),
      );
    } else {
      setAuthMessage(registerSuccess, 'Registered! Check your email to confirm your account.');
    }
  } catch (error) {
    const message = error?.message || error?.error_description || 'Registration failed.';
    console.error('Register failed:', error);
    setAuthMessage(registerError, message);
    if (error?.status) registerError.dataset.details = `Status ${error.status}`;
  } finally {
    setButtonLoading(registerSubmit, false);
  }
}

async function init() {
  feedModeSelect.value = appState.feedMode;
  themeSelect.value = appState.themePreference;
  applyTheme(appState.themePreference);
  updateEngagementToggleUI();
  if (engagementToggle) {
    engagementToggle.addEventListener('change', () =>
      setEngagementMode(engagementToggle.checked ? 'slider' : 'likes'),
    );
  }
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (appState.themePreference === 'system') {
        applyTheme('system');
      }
    });
  }

  resetAppState();

  const { data } = await supabase.auth.getSession();
  session = data.session;
  currentUser = session?.user ?? null;
  updateAuthUI(Boolean(currentUser));

  const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
    session = newSession;
    currentUser = newSession?.user ?? null;
    resetAppState();
    updateAuthUI(Boolean(currentUser));
    if (currentUser) {
      showAuth(false);
      destroyAuthOverlay();
      const targetScreen = appState.lastScreen || 'feed';
      showScreen(targetScreen);
      ensureProfile(true).catch((error) => console.error('Profile preload failed:', error));
      ensureFriends(true).catch((error) => console.error('Friends preload failed:', error));
      ensureFriendRequests(true).catch((error) =>
        console.error('Friend requests preload failed:', error),
      );
      ensureFeed(true).catch((error) => console.error('Feed preload failed:', error));
      handleDeepLinks();
      checkPostCreatedFlag();
    } else {
      showAuth(true);
    }
  });

  window.addEventListener('beforeunload', () => {
    authListener?.subscription?.unsubscribe();
  });

  window.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') return;
    if (event.data.type === 'kyotee:post_created') {
      handleExternalPostCreated();
    }
  });

  if (currentUser) {
    showAuth(false);
    destroyAuthOverlay();
    const targetScreen = appState.lastScreen || 'feed';
    showScreen(targetScreen);
    ensureProfile(true).catch((error) => console.error('Profile preload failed:', error));
    ensureFriends(true).catch((error) => console.error('Friends preload failed:', error));
    ensureFriendRequests(true).catch((error) =>
      console.error('Friend requests preload failed:', error),
    );
    ensureFeed(true).catch((error) => console.error('Feed preload failed:', error));
    handleDeepLinks();
    checkPostCreatedFlag();
  } else {
    showAuth(true);
  }
}

function updateAuthUI(signedIn) {
  createPostFab.hidden = !signedIn;
  if (signedIn) {
    showAuth(false);
  } else {
    showAuth(true);
  }
  updateCommentsInputState();
}

Array.from(document.querySelectorAll('[data-switch-to]')).forEach((button) => {
  button.addEventListener('click', () => {
    selectAuthTab(button.dataset.switchTo);
  });
});
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    showScreen(button.dataset.screen);
  });
});

feedModeSelect.addEventListener('change', async (event) => {
  appState.feedMode = event.target.value;
  persistPrefs();
  await ensureFeed(true);
  showSnackbar(`Showing ${appState.feedMode === 'latest' ? 'latest' : 'recommended'} posts`);
});

createPostFab.addEventListener('click', () => {
  if (!currentUser) {
    showSnackbar('Sign in to create a post.');
    return;
  }
  if (window.matchMedia('(max-width: 720px)').matches) {
    window.location.href = './create-post.html';
  } else {
    window.open('./create-post.html', 'kyoteeCreatePost', 'width=520,height=520');
  }
});

searchInput.addEventListener('input', (event) => {
  const query = event.target.value.trim();
  clearTimeout(searchTimer);
  if (!query) {
    appState.searchUsers = [];
    appState.searchPosts = [];
    searchResults.innerHTML = '';
    searchLoading.hidden = true;
    return;
  }
  searchTimer = setTimeout(() => {
    loadSearchResults(query);
  }, 300);
});

if (privacyPolicyBtn) {
  privacyPolicyBtn.addEventListener('click', () => {
    window.open(PRIVACY_POLICY_URL, '_blank', 'noopener');
  });
}
if (manageDataBtn) {
  manageDataBtn.addEventListener('click', () => {
    window.open(PARTIAL_DATA_URL, '_blank', 'noopener');
  });
}
if (deleteAccountBtn) {
  deleteAccountBtn.addEventListener('click', () => {
    const confirmed = confirm(
      'This will open the account deletion instructions in a new tab. Continue?',
    );
    if (confirmed) {
      window.open(ACCOUNT_DELETION_URL, '_blank', 'noopener');
    }
  });
}

if (commentForm) {
  commentForm.addEventListener('submit', submitComment);
}
if (commentTextarea) {
  commentTextarea.addEventListener('input', () => {
    if (commentSubmit && currentUser) {
      commentSubmit.disabled = commentTextarea.value.trim().length === 0;
    }
  });
}
if (replyIndicatorCancel) {
  replyIndicatorCancel.addEventListener('click', () => {
    clearReplyTarget();
  });
}
if (commentsCloseBtn) {
  commentsCloseBtn.addEventListener('click', () => {
    closeComments();
  });
}
if (commentsOverlay) {
  commentsOverlay.addEventListener('click', (event) => {
    if (event.target === commentsOverlay) {
      closeComments();
    }
  });
}
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && commentsOverlay?.classList.contains('open')) {
    closeComments();
  }
});

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  sendMessage();
});
msgInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
  if ((event.key === 'Backspace' || event.key === 'Delete') && chatAttachmentFile) {
    const value = msgInput.value;
    const selectionStart = msgInput.selectionStart;
    const selectionEnd = msgInput.selectionEnd;
    if (
      !value ||
      (selectionStart === 0 && selectionEnd === 0 && value.trim().length === 0)
    ) {
      event.preventDefault();
      resetChatAttachment();
    }
  }
});

if (chatAttachBtn && chatImageInput) {
  chatAttachBtn.addEventListener('click', () => chatImageInput.click());
  chatImageInput.addEventListener('change', () => {
    const file = chatImageInput.files?.[0];
    if (!file) {
      resetChatAttachment();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showSnackbar('Image must be under 5 MB.');
      resetChatAttachment();
      return;
    }
    if (chatAttachmentPreviewUrl) {
      URL.revokeObjectURL(chatAttachmentPreviewUrl);
    }
    chatAttachmentFile = file;
    chatAttachmentPreviewUrl = URL.createObjectURL(file);
    if (chatImagePreview) {
      chatImagePreview.src = chatAttachmentPreviewUrl;
      chatImagePreview.hidden = false;
    }
  });
}

if (profileAvatarChangeBtn && profileAvatarInput) {
  profileAvatarChangeBtn.addEventListener('click', () => {
    if (!currentUser) {
      showSnackbar('Sign in to update your profile.');
      return;
    }
    profileAvatarInput.click();
  });
  profileAvatarInput.addEventListener('change', async () => {
    const file = profileAvatarInput.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_FILE_SIZE) {
      showSnackbar('Avatar must be under 5 MB.');
      profileAvatarInput.value = '';
      return;
    }
    if (!currentUser) {
      showSnackbar('Sign in to update your profile.');
      profileAvatarInput.value = '';
      return;
    }
    setButtonLoading(profileAvatarChangeBtn, true, 'Uploading…');
    try {
      const publicUrl = await uploadProfileAvatar(file, currentUser.id);
      const applied = await applyProfileUpdates({ avatar_url: publicUrl });
      if (applied && applied.avatar_url) {
        showSnackbar('Avatar updated.');
      } else {
        showSnackbar('Avatar saved.');
      }
    } catch (error) {
      console.error('Avatar update failed:', error);
      const message =
        typeof error?.message === 'string' && error.message
          ? error.message
          : 'Failed to update avatar.';
      showSnackbar(message);
    } finally {
      setButtonLoading(profileAvatarChangeBtn, false);
      profileAvatarInput.value = '';
    }
  });
}

if (profileUsernameEditBtn) {
  profileUsernameEditBtn.addEventListener('click', async () => {
    if (!currentUser) {
      showSnackbar('Sign in to update your profile.');
      return;
    }
    const existing =
      (appState.profile?.username || '').trim() ||
      (currentUser.email ? currentUser.email.split('@')[0] : '');
    const next = prompt('Update your display name', existing);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed) {
      showSnackbar('Username cannot be empty.');
      return;
    }
    if (trimmed === existing) {
      showSnackbar('Username unchanged.');
      return;
    }
    setButtonLoading(profileUsernameEditBtn, true, 'Saving…');
    try {
      const existingUsername = await supabase
        .from('profiles')
        .select('id')
        .eq('username', trimmed)
        .maybeSingle();
      if (existingUsername.error && existingUsername.error.code !== 'PGRST116') {
        throw existingUsername.error;
      }
      if (existingUsername.data && existingUsername.data.id !== currentUser.id) {
        showSnackbar('Username already taken.');
        return;
      }
      const applied = await applyProfileUpdates({ username: trimmed });
      if (applied && applied.username) {
        showSnackbar('Username updated.');
      } else {
        showSnackbar('Username saved.');
      }
    } catch (error) {
      console.error('Username update failed:', error);
      const message = error?.message || 'Failed to update username.';
      showSnackbar(message);
    } finally {
      setButtonLoading(profileUsernameEditBtn, false);
    }
  });
}

if (profilePhoneEditBtn) {
  profilePhoneEditBtn.addEventListener('click', async () => {
    if (!currentUser) {
      showSnackbar('Sign in to update your profile.');
      return;
    }
    const existing = (appState.profile?.phone || '').trim();
    const next = prompt('Add a phone number (leave blank to remove it)', existing);
    if (next === null) return;
    const trimmed = next.trim();
    if (trimmed === existing) {
      showSnackbar('Phone number unchanged.');
      return;
    }
    if (trimmed) {
      const digits = trimmed.replace(/[^0-9]/g, '');
      if (digits.length < 10) {
        showSnackbar('Please enter a valid phone number.');
        return;
      }
    }
    setButtonLoading(profilePhoneEditBtn, true, 'Saving…');
    try {
      const applied = await applyProfileUpdates({ phone: trimmed ? trimmed : null });
      const appliedHasPhone = applied && Object.prototype.hasOwnProperty.call(applied, 'phone');
      if (!appliedHasPhone) {
        showSnackbar('Phone numbers are not supported in this preview yet.');
      } else {
        showSnackbar(trimmed ? 'Phone number updated.' : 'Phone number removed.');
      }
    } catch (error) {
      console.error('Phone update failed:', error);
      const message = error?.message || 'Failed to update phone number.';
      showSnackbar(message);
    } finally {
      setButtonLoading(profilePhoneEditBtn, false);
    }
  });
}

shareProfileBtn.addEventListener('click', () => {
  navigator.clipboard?.writeText(location.href).catch(() => {});
  showSnackbar('Profile link copied');
});

logoutBtn.addEventListener('click', async () => {
  try {
    await supabase.auth.signOut({ scope: 'local' });
    await supabase.auth.signOut({ scope: 'global' }).catch(() => {});
    clearStoredMessages();
    session = null;
    currentUser = null;
    resetAppState();
    updateAuthUI(false);
    showAuth(true);
    showSnackbar('Signed out');
  } catch (error) {
    console.error('Sign out failed:', error);
    showSnackbar('Failed to sign out.');
  }
});

themeSelect.addEventListener('change', () => {
  applyTheme(themeSelect.value);
});

window.addEventListener('pageshow', () => {
  checkPostCreatedFlag();
});

window.addEventListener('storage', (event) => {
  if (event.key === POST_CREATED_FLAG_KEY && event.newValue) {
    checkPostCreatedFlag();
  }
});

if (adminUserSearchBtn) {
  adminUserSearchBtn.addEventListener('click', () => {
    openAdminTool('users');
  });
}
if (adminBanDashboardBtn) {
  adminBanDashboardBtn.addEventListener('click', () => {
    openAdminTool('bans');
  });
}
if (adminReportsBtn) {
  adminReportsBtn.addEventListener('click', () => {
    openAdminTool('reports');
  });
}

init().catch((error) => {
  console.error('Initialization failed:', error);
  showSnackbar('Failed to initialize preview.');
});
