/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Copy,
  Check,
  Terminal,
  Smartphone,
  Database,
  BookOpen,
  Heart,
  ListTodo,
  Wallet,
  Coins,
  ArrowRight,
  RotateCcw,
  Code,
  User,
  Plus,
  Trash,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

// Import stored code listings
import { DATABASE_CODE, BOT_CODE, REQUIREMENTS_CODE } from "./codeData";

// Active mockup profiles for simulation
const MOCK_SELF = { id: 777001, name: "Алексей (Вы)", username: "@alex_family" };
const MOCK_WIFE = { id: 777002, name: "Мария (Жена)", username: "@maria_love" };

interface Expense {
  id: number;
  telegram_id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface ShoppingItem {
  id: number;
  item_name: string;
  added_by: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  inlineButtons?: { text: string; callbackId: string; style?: "danger" | "primary" | "secondary" }[][];
  isFsmPrompt?: boolean;
}

export default function App() {
  // Navigation Tabs for Left Panel
  const [activeTab, setActiveTab ] = useState<"code" | "termux" | "structure">("code");
  // Active Code file inspected
  const [activeFile, setActiveFile] = useState<"database" | "bot" | "requirements">("bot");
  // Clipboard copy tracker
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // --- SQLite Mock Database State ---
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, telegram_id: 777002, amount: 1550, category: "Продукты", description: "Супермаркет Окей", date: "2026-05-24 10:15:00" },
    { id: 2, telegram_id: 777001, amount: 2400, category: "Машина", description: "Заправка АИ-95 лукойл", date: "2026-05-24 11:30:00" },
    { id: 3, telegram_id: 777002, amount: 4800, category: "ЖКХ", description: "Оплата электричества и воды", date: "2026-05-20 09:00:00" },
  ]);

  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([
    { id: 1, item_name: "Молоко 2.5% Домик в деревне", added_by: "@maria_love" },
    { id: 2, item_name: "Сыр Ламбер 350г", added_by: "@maria_love" },
    { id: 3, item_name: "Батон пшеничный", added_by: "@alex_family" },
    { id: 4, item_name: "Стиральный порошок Tide", added_by: "@maria_love" },
  ]);

  // --- Telegram Client Bot Mock Simulation States ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "init_1",
      sender: "bot",
      text: "👋 Привет, Алексей!\n\n🤖 Я твой умный семейный помощник для ведения бюджета и списков покупок.\n\n💳 С моей помощью вы можете:\n• Совместно вести учет расходов семьи по категориям\n• Просматривать отчеты за текущий месяц\n• Создавать и обновлять общий список покупок в реальном времени\n\nИспользуйте кнопки меню ниже для управления!",
      time: "14:13",
    }
  ]);

  const [botFsm, setBotFsm] = useState<{
    step: "idle" | "waiting_for_amount" | "waiting_for_category" | "waiting_for_description" | "waiting_for_shopping";
    currentData: Partial<Expense> & { shopping_item_name?: string };
  }>({
    step: "idle",
    currentData: {}
  });

  const [userTextInput, setUserTextInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopyCode = (filename: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedFile(filename);
      showToast(`Код ${filename} скопирован в буфер!`);
      setTimeout(() => setCopiedFile(null), 2000);
    }
  };

  // Helper time string
  const getSimulatedTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  };

  // --- Bot Action Processors ---

  // Handle Bottom Menu Button Taps
  const handleMenuButton = (button: "finance" | "shopping") => {
    const time = getSimulatedTime();
    
    // Reset any FSM of other types to avoid glitches
    setBotFsm({ step: "idle", currentData: {} });

    if (button === "finance") {
      // User says 💰 Финансы
      const newUserMsg: ChatMessage = {
        id: `msg_${Date.now()}_u`,
        sender: "user",
        text: "💰 Финансы",
        time,
      };

      // Calculate totals
      const totalSum = expenses.reduce((acc, current) => acc + current.amount, 0);
      const categoryTotals = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);

      const standardCats = ["Продукты", "ЖКХ", "Машина", "Другое"];
      let categoryDetails = "";
      const catIcons: Record<string, string> = {
        "Продукты": "🛒",
        "ЖКХ": "🔌",
        "Машина": "🚗",
        "Другое": "📦"
      };

      standardCats.forEach(cat => {
        const spent = categoryTotals[cat] || 0;
        const icon = catIcons[cat] || "🔹";
        categoryDetails += `${icon} ${cat}: **${spent.toLocaleString("ru-RU")} руб.**\n`;
      });

      const reportText = (
        `📊 **Финансовый отчет**\n` +
        `🗓 **Период:** Май 2026\n\n` +
        `💳 **Общие расходы семьи:** ${totalSum.toLocaleString("ru-RU")} руб.\n\n` +
        `📂 **Распределение по категориям:**\n` +
        `${categoryDetails}`
      );

      const botReply: ChatMessage = {
        id: `msg_${Date.now()}_b`,
        sender: "bot",
        text: reportText,
        time,
        inlineButtons: [
          [
            { text: "➕ Добавить расход", callbackId: "add_expense" }
          ]
        ]
      };

      setChatMessages(prev => [...prev, newUserMsg, botReply]);

    } else if (button === "shopping") {
      // User says 📝 Список покупок
      const newUserMsg: ChatMessage = {
        id: `msg_${Date.now()}_u`,
        sender: "user",
        text: "📝 Список покупок",
        time,
      };

      const botReply = makeShoppingListBotMessage(time);
      setChatMessages(prev => [...prev, newUserMsg, botReply]);
    }
  };

  const makeShoppingListBotMessage = (time: string): ChatMessage => {
    if (shoppingList.length === 0) {
      return {
        id: `msg_${Date.now()}_b`,
        sender: "bot",
        text: "📝 **Семейный список покупок**\n\n🛒 На данный момент в списке нет товаров! Все куплено. 🎉\n\nНажмите кнопку ниже, чтобы разместить новый заказ!",
        time,
        inlineButtons: [
          [{ text: "➕ Добавить в список", callbackId: "add_sh_item" }]
        ]
      };
    }

    const itemsButtons = shoppingList.map(item => [
      {
        text: `❌ 🛒 ${item.item_name} (от ${item.added_by})`,
        callbackId: `del_sh_${item.id}`,
        style: "danger" as const
      }
    ]);

    itemsButtons.push([
      { text: "➕ Добавить в список", callbackId: "add_sh_item", style: "primary" as const }
    ]);

    return {
      id: `msg_${Date.now()}_b`,
      sender: "bot",
      text: "📝 **Семейный список покупок**\nВычеркивайте купленные товары кликом по кнопкам ниже:\n\n",
      time,
      inlineButtons: itemsButtons
    };
  };

  // Handle Inline Keyboard Clicks
  const handleCallbackQuery = (callbackId: string) => {
    const time = getSimulatedTime();

    if (callbackId === "add_expense") {
      // Initiate Adding Expense
      setBotFsm({
        step: "waiting_for_amount",
        currentData: {}
      });

      const botPrompt: ChatMessage = {
        id: `fsm_${Date.now()}`,
        sender: "bot",
        text: "✍️ **Шаг 1 из 3:** Введите сумму расхода (числовое значение, например: `450` или `1200.50`):",
        time,
        isFsmPrompt: true
      };

      setChatMessages(prev => [...prev, botPrompt]);

    } else if (callbackId === "add_sh_item") {
      // Initiate Adding Shopping Item
      setBotFsm({
        step: "waiting_for_shopping",
        currentData: {}
      });

      const botPrompt: ChatMessage = {
        id: `fsm_${Date.now()}`,
        sender: "bot",
        text: "✍️ Введите название товара или продукта, который необходимо купить (например: 'Сыр Ламбер 300г' или 'Стиральный порошок'):",
        time,
        isFsmPrompt: true
      };

      setChatMessages(prev => [...prev, botPrompt]);

    } else if (callbackId.startsWith("del_sh_")) {
      const itemId = parseInt(callbackId.split("del_sh_")[1]);
      const deletedItem = shoppingList.find(i => i.id === itemId);
      
      if (deletedItem) {
        // Delete item from shopping list
        setShoppingList(prev => prev.filter(i => i.id !== itemId));
        showToast("🛒 Товар куплен и убран из базы данных!");
        
        // Let's print the update response as standard bot response
        setTimeout(() => {
          const updateMsg: ChatMessage = {
            id: `msg_del_${Date.now()}`,
            sender: "bot",
            text: `🟢 Товар **"${deletedItem.item_name}"** вычеркнут Алексеем!`,
            time: getSimulatedTime(),
          };
          
          setChatMessages(prev => [...prev, updateMsg, makeShoppingListBotMessage(getSimulatedTime())]);
        }, 100);
      }

    } else if (callbackId.startsWith("set_cat_")) {
      const category = callbackId.split("set_cat_")[1];
      
      setBotFsm(prev => ({
        step: "waiting_for_description",
        currentData: { ...prev.currentData, category }
      }));

      const botPrompt: ChatMessage = {
        id: `fsm_${Date.now()}`,
        sender: "bot",
        text: `📂 **Категория выбрана:** ${category}\n\n📝 **Шаг 3 из 3:** Введите короткое описание расхода (что именно купили, например: 'Молоко и бананы' или 'Аренда гаража'):`,
        time,
        isFsmPrompt: true
      };

      setChatMessages(prev => [...prev, botPrompt]);
    }
  };

  // Submit Text Input inside simulated Chat (represents user writing custom messages)
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userTextInput.trim()) return;

    const userText = userTextInput.trim();
    const time = getSimulatedTime();
    setUserTextInput("");

    // 1. Send User Message Bubble
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: userText,
      time
    };

    setChatMessages(prev => [...prev, userMsg]);

    // 2. Process FSM or custom logic
    setTimeout(() => {
      processStateFlow(userText, time);
    }, 400);
  };

  const processStateFlow = (text: string, time: string) => {
    if (botFsm.step === "waiting_for_amount") {
      // Validate Number
      const amountClean = text.trim().replace(",", ".");
      const amount = parseFloat(amountClean);

      if (isNaN(amount) || amount <= 0) {
        const botError: ChatMessage = {
          id: `err_${Date.now()}`,
          sender: "bot",
          text: "⚠️ Не удалось распознать число. Пожалуйста, введите корректную положительную сумму (например: 750 или 140.25):",
          time,
          isFsmPrompt: true
        };
        setChatMessages(prev => [...prev, botError]);
        return;
      }

      // Valid Amount, store and move to step 2: Category
      setBotFsm(prev => ({
        step: "waiting_for_category",
        currentData: { ...prev.currentData, amount }
      }));

      const botPrompt: ChatMessage = {
        id: `fsm_${Date.now()}`,
        sender: "bot",
        text: `💵 **Сумма принята:** ${amount.toLocaleString("ru-RU")} руб.\n\n📂 **Шаг 2 из 3:** Выберите категорию расходов кнопкой ниже:`,
        time,
        inlineButtons: [
          [
            { text: "🛒 Продукты", callbackId: "set_cat_Продукты" },
            { text: "🔌 ЖКХ", callbackId: "set_cat_ЖКХ" }
          ],
          [
            { text: "🚗 Машина", callbackId: "set_cat_Машина" },
            { text: "📦 Другое", callbackId: "set_cat_Другое" }
          ]
        ],
        isFsmPrompt: true
      };
      setChatMessages(prev => [...prev, botPrompt]);

    } else if (botFsm.step === "waiting_for_description") {
      // Final step: save expense inside mock database
      const description = text.trim();
      const amount = botFsm.currentData.amount || 0;
      const category = botFsm.currentData.category || "Другое";

      const newExpense: Expense = {
        id: expenses.length + 1,
        telegram_id: MOCK_SELF.id,
        amount,
        category,
        description,
        date: new Date().toISOString().replace("T", " ").substring(0, 19)
      };

      setExpenses(prev => [newExpense, ...prev]);
      setBotFsm({ step: "idle", currentData: {} });

      const botSuccess: ChatMessage = {
        id: `success_${Date.now()}`,
        sender: "bot",
        text: `✅ **Расход записан!**\n\n💰 **Сумма:** ${amount.toLocaleString("ru-RU")} руб.\n📂 **Категория:** ${category}\n📝 **Описание:** ${description}\n\nСпасибо, данные успешно синхронизированы в общий бюджет!`,
        time
      };

      setChatMessages(prev => [...prev, botSuccess]);
      showToast("💰 SQLite: Данные расхода успешно записаны в таблицу finance!");

    } else if (botFsm.step === "waiting_for_shopping") {
      const item_name = text.trim();

      const newItem: ShoppingItem = {
        id: shoppingList.length > 0 ? Math.max(...shoppingList.map(o => o.id)) + 1 : 1,
        item_name,
        added_by: MOCK_SELF.username
      };

      setShoppingList(prev => [...prev, newItem]);
      setBotFsm({ step: "idle", currentData: {} });

      const botSuccess: ChatMessage = {
        id: `success_${Date.now()}`,
        sender: "bot",
        text: `✅ Товар '**${item_name}**' успешно добавлен в семейный список!`,
        time
      };

      setChatMessages(prev => [...prev, botSuccess, makeShoppingListBotMessage(getSimulatedTime())]);
      showToast("🛒 SQLite: Товар успешно записан в таблицу shopping_list!");

    } else {
      // Default echo / command helper if they are not in FSM
      const replyText = `🤔 Команда не распознана. Пожалуйста, используйте кнопки меню на клавиатуре ниже, чтобы работать с финанасами или списком покупок.`;
      const botResponse: ChatMessage = {
        id: `msg_def_${Date.now()}`,
        sender: "bot",
        text: replyText,
        time
      };
      setChatMessages(prev => [...prev, botResponse]);
    }
  };

  // Fast testing injection buttons
  const injectWifeExpense = () => {
    const categoriesForMock = ["Продукты", "ЖКХ", "Машина", "Другое"];
    const itemRandom = [
      { amount: 350, cat: "Продукты", desc: "Сыр Ламбер и хлеб" },
      { amount: 1500, cat: "Другое", desc: "Детские игрушки" },
      { amount: 1200, cat: "Машина", desc: "Омывайка и тряпки" },
      { amount: 850, cat: "Продукты", desc: "Черешня 1кг" },
    ][Math.floor(Math.random() * 4)];

    const wifeExpense: Expense = {
      id: expenses.length + 1,
      telegram_id: MOCK_WIFE.id,
      amount: itemRandom.amount,
      category: itemRandom.cat,
      description: itemRandom.desc,
      date: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    setExpenses(prev => [wifeExpense, ...prev]);
    showToast(`👩 Жена (${MOCK_WIFE.name}) добавила расход ${itemRandom.amount} руб.!`);

    // Optionally append event message into bot chat
    const time = getSimulatedTime();
    const notification: ChatMessage = {
      id: `notif_${Date.now()}`,
      sender: "bot",
      text: `📢 **Новая запись от ${MOCK_WIFE.username}:**\n👩 Добавлен расход на **${itemRandom.amount} руб.**\n📂 Категория: *${itemRandom.cat}*\n📝 Описание: *${itemRandom.desc}*`,
      time
    };
    setChatMessages(prev => [...prev, notification]);
  };

  const injectWifeShopping = () => {
    const productsMock = ["Куриное филе 1кг", "Апельсины 2кг", "Зубная паста Colgate", "Шоколад Ritter Sport", "Минеральная вода 6шт"];
    const randomProduct = productsMock[Math.floor(Math.random() * productsMock.length)];

    const newItem: ShoppingItem = {
      id: shoppingList.length > 0 ? Math.max(...shoppingList.map(o => o.id)) + 1 : 1,
      item_name: randomProduct,
      added_by: MOCK_WIFE.username
    };

    setShoppingList(prev => [...prev, newItem]);
    showToast(`👩 Жена (${MOCK_WIFE.name}) добавила "${randomProduct}" в покупки!`);

    // Update bot chat currently shown
    const time = getSimulatedTime();
    const notification: ChatMessage = {
      id: `notif_${Date.now()}`,
      sender: "bot",
      text: fsmHighlight(`📢 ${MOCK_WIFE.username} добавила новый товар в список:\n👉 **${randomProduct}**`),
      time
    };
    setChatMessages(prev => [...prev, notification]);
  };

  const fsmHighlight = (txt: string) => txt;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-white antialiased">
      {/* Dynamic Toast Message */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-600 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-indigo-400 font-medium text-sm"
          >
            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styled Grid Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-xl shadow-lg ring-1 ring-white/10">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Семейный Бюджет & Список покупок
                <span className="text-xs font-mono px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
                  aiogram 3 + SQLite3
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Рабочая, отказоустойчивая архитектура бота для автономного запуска на Android в Termux
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-slate-400">
              Среда разработки: <strong className="text-slate-200">Termux @ Android</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Area - Code, Manual, Architecture (8 Columns) */}
        <section className="lg:col-span-7 flex flex-col gap-6" id="developer_panel">
          
          {/* Navigation Control Toolbar */}
          <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl flex gap-1 shadow-inner">
            <button
              id="tab_code"
              onClick={() => setActiveTab("code")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                activeTab === "code"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Code className="h-4 w-4" />
              Код проекта (3 файла)
            </button>
            <button
              id="tab_termux"
              onClick={() => setActiveTab("termux")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                activeTab === "termux"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Terminal className="h-4 w-4" />
              Инструкция Termux
            </button>
            <button
              id="tab_structure"
              onClick={() => setActiveTab("structure")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                activeTab === "structure"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Database className="h-4 w-4" />
              Архитектура БД
            </button>
          </div>

          {/* Tab Content Display Container */}
          <div className="flex-1 flex flex-col">
            
            {/* TAB 1: CODE EXHIBIT */}
            {activeTab === "code" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl flex-1">
                {/* File selectors */}
                <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 max-w-xs md:max-w-md">
                    <button
                      id="sel_bot"
                      onClick={() => setActiveFile("bot")}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                        activeFile === "bot"
                          ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      bot.py
                    </button>
                    <button
                      id="sel_db"
                      onClick={() => setActiveFile("database")}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                        activeFile === "database"
                          ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      database.py
                    </button>
                    <button
                      id="sel_req"
                      onClick={() => setActiveFile("requirements")}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                        activeFile === "requirements"
                          ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      requirements.txt
                    </button>
                  </div>

                  <button
                    id="btn_copy"
                    onClick={() => {
                      const textMap = {
                        bot: BOT_CODE,
                        database: DATABASE_CODE,
                        requirements: REQUIREMENTS_CODE
                      };
                      const filenameMap = {
                        bot: "bot.py",
                        database: "database.py",
                        requirements: "requirements.txt"
                      };
                      handleCopyCode(filenameMap[activeFile], textMap[activeFile]);
                    }}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600/10 hover:bg-slate-800 border-indigo-500/20 hover:border-slate-700 border text-indigo-400 hover:text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200"
                  >
                    {copiedFile ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Копировать код</span>
                      </>
                    )}
                  </button>
                </div>

                {/* File description tag */}
                <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 text-xs text-slate-400 flex items-center gap-2">
                  <span className="font-semibold text-slate-300">Назначение файла:</span>
                  <span>
                    {activeFile === "bot" && "Основной исполняемый файл с логикой команд, кнопок, диалогов FSM и обработки роутинга."}
                    {activeFile === "database" && "Драйвер базы данных SQLite. Инициализирует таблицы и предоставляет методы для данных."}
                    {activeFile === "requirements" && "Каталог зависимостей для корректного развёртывания бота внутри системного окружения."}
                  </span>
                </div>

                {/* Main Code Viewer Body */}
                <div className="flex-1 overflow-auto max-h-[550px] font-mono text-xs leading-relaxed bg-slate-950 p-4 text-slate-300">
                  <pre className="relative select-text whitespace-pre overflow-x-auto text-left">
                    <code>
                      {(activeFile === "bot" ? BOT_CODE : activeFile === "database" ? DATABASE_CODE : REQUIREMENTS_CODE)
                        .split("\n")
                        .map((line, idx) => (
                          <div key={idx} className="table-row hover:bg-slate-900/40">
                            <span className="table-cell text-slate-600 pr-4 select-none text-right w-8 border-r border-slate-800/40 mr-4">
                              {idx + 1}
                            </span>
                            <span className="table-cell pl-4 whitespace-pre-wrap">{line}</span>
                          </div>
                        ))}
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 2: TERMUX STEP-BY-STEP MANUAL */}
            {activeTab === "termux" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl flex-1 flex flex-col gap-5 text-left">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-indigo-400" />
                    Запуск бота на Android в приложении Termux
                  </h3>
                  <p className="text-sm text-slate-400">
                    Подробное пошаговое руководство для абсолютных новичков. Никаких ручных правок кода не потребуется!
                  </p>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {/* Step 1 */}
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 flex gap-3.5">
                    <div className="h-7 w-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                      1
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="font-semibold text-slate-200 text-sm">Скачайте и установите Termux</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        ⚠️ <strong className="text-amber-400">Важно:</strong> Не устанавливайте Termux из Google Play (версия там давно устарела и не обновляется). Скачайте официальный стабильный `.apk` файл со свободной площадки <strong>F-Droid</strong> или GitHub.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 flex gap-3.5">
                    <div className="h-7 w-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                      2
                    </div>
                    <div className="space-y-2 flex-1">
                      <h4 className="font-semibold text-slate-200 text-sm">Обновите системные пакеты</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Откройте Termux и вставьте команду апгрейда окружения. Если во время выполнения консоль предложит сделать выбор (Y/N) - нажимайте <strong className="text-indigo-450">Enter</strong> для выбора настроек по умолчанию.
                      </p>
                      <div className="bg-slate-900 rounded-lg p-2 flex items-center justify-between border border-slate-800 font-mono text-xs">
                        <span className="text-emerald-400">pkg update && pkg upgrade -y</span>
                        <button
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText("pkg update && pkg upgrade -y");
                              showToast("Команда скопирована!");
                            }
                          }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 flex gap-3.5">
                    <div className="h-7 w-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                      3
                    </div>
                    <div className="space-y-2 flex-1">
                      <h4 className="font-semibold text-slate-200 text-sm">Установите Python и Git</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Для работы нашего проекта потребуются интерпретатор Python 3 и утилита управления sqlite3. Установим их одной строкой:
                      </p>
                      <div className="bg-slate-900 rounded-lg p-2 flex items-center justify-between border border-slate-800 font-mono text-xs">
                        <span className="text-emerald-400">pkg install python git sqlite3 -y</span>
                        <button
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText("pkg install python git sqlite3 -y");
                              showToast("Команда скопирована!");
                            }
                          }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 flex gap-3.5">
                    <div className="h-7 w-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                      4
                    </div>
                    <div className="space-y-2 flex-1">
                      <h4 className="font-semibold text-slate-200 text-sm">Создайте папку проекта и файлы</h4>
                      <p className="text-xs text-slate-400 leading-relaxed text-left">
                        Создайте рабочую директорию бота. Затем скопируйте коды файлов <strong>database.py</strong>, <strong>bot.py</strong> и <strong>requirements.txt</strong> из соседней вкладки и вставьте их туда (можно воспользоваться текстовым редактором nano, установив его через <code>pkg install nano</code>).
                      </p>
                      <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 font-mono text-xs text-slate-400 text-left">
                        <div>mkdir family_bot && cd family_bot</div>
                        <div className="text-slate-600"># создаем файлы и вставляем код</div>
                        <div>nano bot.py</div>
                        <div>nano database.py</div>
                        <div>nano requirements.txt</div>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 flex gap-3.5">
                    <div className="h-7 w-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                      5
                    </div>
                    <div className="space-y-2 flex-1">
                      <h4 className="font-semibold text-slate-200 text-sm">Установите Python-зависимости</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Запустите автоматическую проверку и установку фреймворков, указанных в нашем requirements.txt:
                      </p>
                      <div className="bg-slate-900 rounded-lg p-2 flex items-center justify-between border border-slate-800 font-mono text-xs">
                        <span className="text-emerald-400">pip install -r requirements.txt</span>
                        <button
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText("pip install -r requirements.txt");
                              showToast("Команда скопирована!");
                            }
                          }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 flex gap-3.5">
                    <div className="h-7 w-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                      6
                    </div>
                    <div className="space-y-1.5 flex-1 text-left">
                      <h4 className="font-semibold text-slate-200 text-sm">Зарегистрируйте бота в Telegram</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Откройте Telegram, найдите официального главного бота регистратора <strong className="text-indigo-400">@BotFather</strong>. Отправьте ему команду <code>/newbot</code>, задайте имя и логин. В ответ вы получите уникальный токен вида <strong>BOT_TOKEN</strong> (например: <code>123456:ABC-DEF1234...</code>). Скопируйте его.
                      </p>
                    </div>
                  </div>

                  {/* Step 7 */}
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 flex gap-3.5">
                    <div className="h-7 w-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                      7
                    </div>
                    <div className="space-y-3 flex-1">
                      <h4 className="font-semibold text-slate-200 text-sm">Задайте токен и запустите бота в фоне!</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Чтобы бот не завершал свою работу, когда вы закрываете приложение Termux на смартфоне, экспортируем переменную токена и используем утилиту <strong>nohup</strong> для фонового автономного процесса:
                      </p>
                      
                      {/* Interactive Token generator */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
                          Быстрый генератор команд (введите токен для подстановки):
                        </label>
                        <input
                          type="text"
                          placeholder="Вставьте полученный токен..."
                          onChange={(e) => {
                            const val = e.target.value.trim() || "<ВАШ_ТОКЕН>";
                            const generated = `export BOT_TOKEN='${val}'\nnohup python bot.py > bot_logs.txt 2>&1 &`;
                            const element = document.getElementById("generated_cmd");
                            if (element) element.innerText = generated;
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-600 text-slate-200"
                        />
                      </div>

                      <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 font-mono text-xs flex justify-between items-start">
                        <pre id="generated_cmd" className="text-emerald-400 text-[11px] whitespace-pre-wrap leading-tight text-left">
                          {`export BOT_TOKEN='your_token_here'\nnohup python bot.py > bot_logs.txt 2>&1 &`}
                        </pre>
                        <button
                          onClick={() => {
                            const textCmd = document.getElementById("generated_cmd")?.innerText || "";
                            if (navigator.clipboard && textCmd) {
                              navigator.clipboard.writeText(textCmd);
                              showToast("Фоновая команда запуска скопирована!");
                            }
                          }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        💡 <strong>Подсказка:</strong> nohup направит весь вывод и возможные лог-ошибки в файл <code>bot_logs.txt</code>. Чтобы проверить логи запущенного бота вживую, используйте: <code>tail -f bot_logs.txt</code>.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 3: SQL TABLES & STRUCTURE */}
            {activeTab === "structure" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl flex-1 flex flex-col gap-6 text-left">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <Database className="h-5 w-5 text-indigo-400" />
                    Структура реляционных таблиц (SQLite3)
                  </h3>
                  <p className="text-sm text-slate-400">
                    БД <code>family.db</code> разворачивается автоматически в папке с ботом при первом старте.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Table 1 */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-indigo-400 font-mono uppercase font-semibold">Системные пользователи</span>
                    <h4 className="font-bold text-slate-100 mt-0.5 mb-2 font-mono text-sm">Table: users</h4>
                    <div className="space-y-1.5 font-mono text-xs text-slate-400">
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-200">telegram_id</span>
                        <span>INTEGER PRIMARY KEY</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-200">username</span>
                        <span>TEXT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-200">role</span>
                        <span>TEXT (member)</span>
                      </div>
                    </div>
                  </div>

                  {/* Table 2 */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-indigo-400 font-mono uppercase font-semibold">Список покупок</span>
                    <h4 className="font-bold text-slate-100 mt-0.5 mb-2 font-mono text-sm">Table: shopping_list</h4>
                    <div className="space-y-1.5 font-mono text-xs text-slate-400">
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-200">id</span>
                        <span>INTEGER (AUTOINCREMENT)</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-200">item_name</span>
                        <span>TEXT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-200">added_by</span>
                        <span>TEXT</span>
                      </div>
                    </div>
                  </div>

                  {/* Table 3 */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 md:col-span-2">
                    <span className="text-[10px] text-indigo-400 font-mono uppercase font-semibold">Учет финансовых расходов</span>
                    <h4 className="font-bold text-slate-100 mt-0.5 mb-2 font-mono text-sm">Table: finance</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-xs text-slate-400">
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-200">id</span>
                        <span>INTEGER AUTO_INC</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-200">telegram_id</span>
                        <span>INTEGER</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1 sm:border-0">
                        <span className="text-slate-200">amount</span>
                        <span>REAL</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-200">category</span>
                        <span>TEXT</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1 sm:border-0">
                        <span className="text-slate-200">description</span>
                        <span>TEXT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-200">date</span>
                        <span>TEXT (YYYY-MM-DD...)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DB Status Inspector Mock */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Database className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-300">Состояние базы family.db в симуляторе</span>
                    </div>
                    <button
                      onClick={() => {
                        setExpenses([
                          { id: 1, telegram_id: 777002, amount: 1550, category: "Продукты", description: "Супермаркет Окей", date: "2026-05-24 10:15:00" },
                          { id: 2, telegram_id: 777001, amount: 2400, category: "Машина", description: "Заправка АИ-95 лукойл", date: "2026-05-24 11:30:00" },
                        ]);
                        setShoppingList([
                          { id: 1, item_name: "Молоко 2.5% Домик в деревне", added_by: "@maria_love" },
                          { id: 2, item_name: "Сыр Ламбер 350г", added_by: "@maria_love" },
                        ]);
                        showToast("Симулятор базы данных сброшен!");
                      }}
                      className="text-[10px] text-slate-550 hover:text-white flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2 py-1 rounded border border-slate-800"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Сбросить данные
                    </button>
                  </div>

                  <div className="text-[11px] space-y-2 font-mono">
                    <div>
                      <span className="text-slate-500"># Таблица [finance] (всего строк: {expenses.length})</span>
                      <div className="max-h-24 overflow-y-auto mt-1 p-2 bg-slate-900 rounded border border-slate-850 space-y-1">
                        {expenses.map(e => (
                          <div key={e.id} className="text-slate-400 flex justify-between">
                            <span>{e.id}. User:{e.telegram_id === MOCK_SELF.id ? "Алексей" : "Жена"} | {e.amount}р → {e.category} ({e.description})</span>
                            <span className="text-slate-600 text-[9px]">{e.date.split(" ")[1]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500"># Таблица [shopping_list] (всего строк: {shoppingList.length})</span>
                      <div className="max-h-24 overflow-y-auto mt-1 p-2 bg-slate-900 rounded border border-slate-850 space-y-1">
                        {shoppingList.map(s => (
                          <div key={s.id} className="text-slate-400 flex justify-between">
                            <span>{s.id}. **{s.item_name}**</span>
                            <span className="text-slate-600 text-[10px]">{s.added_by}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </section>

        {/* Right Area - Simulated Telegram Mobile Phone View (5 Columns) */}
        <section className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6" id="telegram_simulator">
          
          {/* Quick injection buttons simulating Wife actions since DB is mutual */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3 text-left">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500 animate-pulse" />
                Панель совместного доступа
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Поскольку бот является <strong>семейным</strong>, база данных обновляется всеми участниками. Симулируйте мгновенные записи от лица вашей жены (Марии), чтобы увидеть синхронизацию данных в SQLite бюджете:
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <button
                id="inject_expense"
                onClick={injectWifeExpense}
                className="py-1.5 px-3 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-900/50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-left cursor-pointer"
              >
                <Coins className="h-3.5 w-3.5" />
                Жена: Вписать расход
              </button>
              <button
                id="inject_shopping"
                onClick={injectWifeShopping}
                className="py-1.5 px-3 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-900/50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-left cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Жена: Добавить продукт
              </button>
            </div>
          </div>

          {/* Core Telegram Smartphone Frame */}
          <div className="w-full max-w-[400px] mx-auto bg-slate-950 border border-slate-800 rounded-[38px] p-3 shadow-2xl ring-12 ring-slate-900 relative">
            
            {/* Camera notch */}
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-28 h-4.5 bg-slate-950 rounded-full z-20 flex items-center justify-center">
              <div className="w-3.5 h-3.5 bg-slate-900 rounded-full border border-slate-800 mr-2" />
              <div className="w-1.5 h-1.5 bg-indigo-950 rounded-full" />
            </div>

            {/* Simulated Phone Screen Container */}
            <div className="bg-slate-900 w-full rounded-[30px] overflow-hidden flex flex-col h-[600px] border border-slate-800 text-left relative">
              
              {/* Telegram Header */}
              <div className="bg-slate-950/90 pt-6 pb-2.5 px-4 flex items-center gap-3 border-b border-slate-850 shrink-0 z-10">
                <div className="h-8.5 w-8.5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  СБ
                </div>
                <div>
                  <div className="text-[13px] font-bold text-slate-100 flex items-center gap-1.5">
                    Семейный Бюджет Бот
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[10px] text-slate-450 leading-none">бот</div>
                </div>
              </div>

              {/* Chat Window with bubbles */}
              <div className="flex-1 overflow-y-auto px-3 py-4 bg-slate-910 space-y-3.5 flex flex-col scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <div className="text-center">
                  <span className="text-[9px] font-medium font-mono bg-slate-950/55 px-2.5 py-0.5 rounded-full text-slate-500">
                    24 МАЯ 2026г.
                  </span>
                </div>

                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      msg.sender === "user" ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    {/* Message Bubble */}
                    <div
                      className={`p-3 rounded-2xl text-[12.5px] leading-relaxed shadow-md ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : msg.isFsmPrompt
                          ? "bg-slate-950 text-indigo-300 border border-slate-850 rounded-tl-none ring-1 ring-indigo-500/20"
                          : "bg-slate-950 text-slate-200 border border-slate-850 rounded-tl-none"
                      }`}
                    >
                      <p className="whitespace-pre-line text-left">{msg.text}</p>
                      <div className={`text-[9px] mt-1.5 text-right font-mono ${msg.sender === "user" ? "text-indigo-200" : "text-slate-500"}`}>
                        {msg.time}
                      </div>
                    </div>

                    {/* Inline Buttons associated with this bubble */}
                    {msg.inlineButtons && msg.inlineButtons.length > 0 && (
                      <div className="mt-1.5 space-y-1 w-full flex flex-col items-stretch">
                        {msg.inlineButtons.map((row, rIdx) => (
                          <div key={rIdx} className="flex gap-1">
                            {row.map((btn, bIdx) => (
                              <button
                                key={bIdx}
                                onClick={() => handleCallbackQuery(btn.callbackId)}
                                className={`flex-1 py-1.5 px-2.5 text-center text-xs font-semibold rounded-lg border cursor-pointer transition-all duration-150 ${
                                  btn.style === "danger"
                                    ? "bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border-rose-900/50"
                                    : btn.style === "primary"
                                    ? "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-700"
                                    : "bg-slate-950 hover:bg-slate-850 text-indigo-400 border-slate-800/80 hover:border-slate-700"
                                }`}
                              >
                                {btn.text}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Active States Notification for testing feedback */}
                {botFsm.step !== "idle" && (
                  <div className="text-center py-1">
                    <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full animate-pulse">
                      Фреймворк FSM: waiting_for_{botFsm.step.split("waiting_for_")[1]}
                    </span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Bot Bottom Input Area */}
              <div className="p-2 bg-slate-950/80 border-t border-slate-850 leading-none shrink-0 space-y-1.5 flex flex-col">
                <form onSubmit={handleSendMessage} className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={userTextInput}
                    onChange={(e) => setUserTextInput(e.target.value)}
                    placeholder={
                      botFsm.step === "waiting_for_amount"
                        ? "Введите сумму (число)..."
                        : botFsm.step === "waiting_for_category"
                        ? "Выберите категорию кнопками..."
                        : botFsm.step === "waiting_for_description"
                        ? "Введите описание покупки..."
                        : botFsm.step === "waiting_for_shopping"
                        ? "Введите название товара..."
                        : "Напишите сообщение..."
                    }
                    className="flex-1 bg-slate-900 text-slate-200 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition"
                  >
                    Отправить
                  </button>
                </form>

                {/* Persistent Menu Keyboard Menu Bottom */}
                <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-900">
                  <button
                    id="btn_sim_finance"
                    type="button"
                    onClick={() => handleMenuButton("finance")}
                    className="py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800/80 active:bg-slate-850 rounded-lg text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                    💰 Финансы
                  </button>
                  <button
                    id="btn_sim_shopping"
                    type="button"
                    onClick={() => handleMenuButton("shopping")}
                    className="py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800/80 active:bg-slate-850 rounded-lg text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <ListTodo className="h-3.5 w-3.5 text-emerald-400" />
                    📝 Список покупок
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* Styled Footer */}
      <footer className="border-t border-slate-850 bg-slate-900/40 py-6 text-center text-xs text-slate-500 mt-auto px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Google AI Studio Build. Все права защищены.</p>
          <p className="flex items-center gap-1">
            Разработано с заботой о семейном уюте <Heart className="h-3 w-3 text-red-500 fill-red-500" />
          </p>
        </div>
      </footer>
    </div>
  );
}
