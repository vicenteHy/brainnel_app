import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// 您的 Firebase 项目的网页应用配置
const firebaseConfig = {
  apiKey: "AIzaSyBorDPIrW3EJEdQabcejj8ETqqOCaFBHjE",
  authDomain: "brainnel-7eead.firebaseapp.com",
  projectId: "brainnel-7eead",
  storageBucket: "brainnel-7eead.firebasestorage.app",
  messagingSenderId: "449517618313",
  appId: "1:449517618313:ios:6fc58230dac8900b74b258",
};

// 只有在没有应用时才初始化
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// 获取 Auth 实例
const auth = getAuth(app);

export { auth }; 