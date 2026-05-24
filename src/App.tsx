import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Copy,
  Check,
  Terminal,
  Smartphone,
  Database,
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
  Calendar,
  Sparkle,
} from "lucide-react";

// Import stored code listings
import { DATABASE_CODE, HANDLERS_CODE, BOT_CODE, REQUIREMENTS_CODE } from "./codeData";

// Active mockup profiles for simulation
const MOCK_SELF = { id: 777001, name: "Алексей (Вы)", username: "@alex_family" };
const MOCK_WIFE = { id: 777002, name: "Мария (Жена)", username: "@maria_love" };
const MOCK_GRANDMA = { id: 777003, name: "Татьяна Игоревна", username: "@grandma_tatyana" };

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

interface CalendarEvent {
  id: number;
  event_text: string;
  event_date: string;
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
  const [activeTab, setActiveTab] = useState<"code" | "termux" | "structure">("code");
  // Active Code file inspected
  const [activeFile, setActiveFile] = useState<"database" | "handlers" | "bot" | "requirements">("handlers");
  // Clipboard copy tracker
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // --- SQLite Mock Database State ---
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, telegram_id: 777002, amount: 1550, category: "Продукты", description: "Супермаркет Окей", date: "2026-05-24 10:15:00" },
    { id: 2, telegram_id: 777001, amount: 2400, category: "Машина", description: "Заправка АИ-95 Лукойл", date: "2026-05-24 11:30:00" },
    { id: 3, telegram_id: 777002, amount: 4800, category: "ЖКХ", description: "Оплата электричества и воды", date: "2026-05-20 09:00:00" },
  ]);

  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([
    { id: 1, item_name: "Молоко 2.5% Домик в деревне", added_by: "@maria_love" },
    { id: 2, item_name: "Сыр Ламбер 350г", added_by: "@maria_love" },
    { id: 3, item_name: "Багет пшеничный", added_by: "@alex_family" },
  ]);

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
    { id: 1, event_text: "День Рождения Мамы 🎉", event_date: "30 Июня", added_by: "@maria_love" },
    { id: 2, event_text: "Визит сантехника (счетчики) 🔌", event_date: "28 Мая", added_by: "@alex_family" },
  ]);

  const [users, setUsers] = useState<string[]>([
    "@alex_family",
    "@maria_love",
    "@grandma_tatyana"
  ]);

  // --- Telegram Client Bot Mock Simulation States ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Initialize Chat Messages with standard aiogram interactive main menu!
  useEffect(() => {
    const initTime = getSimulatedTime();
    setChatMessages([
      {
        id: "init_menu",
        sender: "bot",
        text: "🙋‍♂️ **Семейный Центр Управления**\n💼 Рады видеть вас, *Алексей*!\n─────────────────────────\nИнтерактивный хаб для ведения домашнего хозяйства, общего бюджета и совместных планов в реальном времени. Все изменения мгновенно синхронизируются для всех участников семьи.\n\n📎 *Выберите модуль управления на панели ниже:*🗣",
        time: initTime,
        inlineButtons: [
          [
            { text: "💰 Финансы & Бюджет", callbackId: "menu_finance" },
            { text: "📝 Покупки Семьи", callbackId: "menu_shopping" }
          ],
          [
            { text: "📅 Календарь Событий", callbackId: "menu_calendar" },
            { text: "🧹 Дежурный по дому", callbackId: "menu_duty" }
          ]
        ]
      }
    ]);
  }, []);

  const [botFsm, setBotFsm] = useState<{
    step: "idle" | "waiting_for_amount" | "waiting_for_category" | "waiting_for_description" | "waiting_for_shopping" | "waiting_for_cal_date" | "waiting_for_cal_text";
    currentData: any;
  }>({
    step: "idle",
    currentData: {}
  });

  const [userTextInput, setUserTextInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [rollingActive, setRollingActive] = useState(false);
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

  // --- Dynamic Keyboard builders ---

  const getMainMenuInlineButtons = () => [
    [
      { text: "💰 Финансы & Бюджет", callbackId: "menu_finance" },
      { text: "📝 Покупки Семьи", callbackId: "menu_shopping" }
    ],
    [
      { text: "📅 Календарь Событий", callbackId: "menu_calendar" },
      { text: "🧹 Дежурный по дому", callbackId: "menu_duty" }
    ]
  ];

  // --- Bot Action Processors ---

  const handleCallbackQuery = async (callbackId: string) => {
    if (rollingActive) return; // ignore clicks during lottery rolling
    const time = getSimulatedTime();
    
    // Clear any FSM
    setBotFsm({ step: "idle", currentData: {} });

    if (callbackId === "main_menu") {
      const menuMsg: ChatMessage = {
        id: `msg_menu_${Date.now()}`,
        sender: "bot",
        text: "🙋‍♂️ **Семейный Центр Управления**\n💼 Рады видеть вас, *Алексей*!\n─────────────────────────\nИнтерактивный хаб для ведения домашнего хозяйства, общего бюджета и совместных планов в реальном времени.\n\n📎 *Выберите модуль управления на панели ниже:*🗣",
        time,
        inlineButtons: getMainMenuInlineButtons()
      };
      setChatMessages(prev => [...prev, menuMsg]);

    } else if (callbackId === "menu_finance") {
      // 1. Calculate Monthly stats
      const total = expenses.reduce((sum, item) => sum + item.amount, 0);
      const catTotalsObj: any = { "Продукты": 0, "ЖКХ": 0, "Машина": 0, "Другое": 0 };
      expenses.forEach(e => {
        catTotalsObj[e.category] = (catTotalsObj[e.category] || 0) + e.amount;
      });

      const catIcons: any = { "Продукты": "🛒", "ЖКХ": "🔌", "Машина": "🚗", "Другое": "📦" };
      let categoryLines = "";
      Object.keys(catTotalsObj).forEach(cat => {
        categoryLines += `${catIcons[cat] || "🔹"} ${cat}: **${catTotalsObj[cat].toLocaleString("ru-RU")} руб.**\n`;
      });

      // Calculate contribution by users
      const usersSpentObj: any = {};
      expenses.forEach(e => {
        const key = e.telegram_id === MOCK_SELF.id ? MOCK_SELF.username : MOCK_WIFE.username;
        usersSpentObj[key] = (usersSpentObj[key] || 0) + e.amount;
      });

      let userLines = "";
      Object.keys(usersSpentObj).forEach(u => {
        userLines += `👤 ${u}: **${usersSpentObj[u].toLocaleString("ru-RU")} руб.**\n`;
      });

      const financeText = (
        `💰 **Семейный Бюджет и Траты**\n` +
        `🗓 **Период:** Май 2026\n` +
        `─────────────────────────\n` +
        `💳 **Всего потрачено семьей:** ${total.toLocaleString("ru-RU")} руб.\n\n` +
        `📂 **Расходы по категориям:**\n` +
        `${categoryLines}\n` +
        `─────────────────────────\n` +
        `👤 **Вклад участников:**\n` +
        `${userLines || "Записей пока нет."}`
      );

      const financeMsg: ChatMessage = {
        id: `msg_fin_${Date.now()}`,
        sender: "bot",
        text: financeText,
        time,
        inlineButtons: [
          [{ text: "➕ Добавить новый расход", callbackId: "finance_add_init" }],
          [{ text: "🔙 Назад в меню", callbackId: "main_menu", style: "secondary" }]
        ]
      };
      setChatMessages(prev => [...prev, financeMsg]);

    } else if (callbackId === "finance_add_init") {
      setBotFsm({ step: "waiting_for_amount", currentData: {} });
      const prompt: ChatMessage = {
        id: `msg_fsm_fin_${Date.now()}`,
        sender: "bot",
        text: "💰 **Добавление нового расхода • Шаг 1 из 3**\n─────────────────────────\n✍️ Пожалуйста, введите **сумму** вашего расхода (например, `450` или `1250.50`):",
        time,
        isFsmPrompt: true,
        inlineButtons: [[{ text: "🔙 Назад в меню", callbackId: "main_menu", style: "secondary" }]]
      };
      setChatMessages(prev => [...prev, prompt]);

    } else if (callbackId.startsWith("fin_cat_")) {
      const category = callbackId.replace("fin_cat_", "");
      const amount = botFsm.currentData.amount;
      
      setBotFsm({
        step: "waiting_for_description",
        currentData: { amount, category }
      });

      const prompt: ChatMessage = {
        id: `msg_fsm_desc_${Date.now()}`,
        sender: "bot",
        text: `📂 **Категория:** ${category}\n─────────────────────────\n📂 **Добавление расхода • Шаг 3 из 3**\n✍️ Напишите краткое описание или цель расхода (например, 'Купила сыр и овощи' или 'Оплата интернета'):`,
        time,
        isFsmPrompt: true,
        inlineButtons: [[{ text: "🔙 Назад в меню", callbackId: "main_menu", style: "secondary" }]]
      };
      setChatMessages(prev => [...prev, prompt]);

    } else if (callbackId === "menu_shopping") {
      triggerShoppingView(time);

    } else if (callbackId === "shop_add_init") {
      setBotFsm({ step: "waiting_for_item", currentData: {} });
      const prompt: ChatMessage = {
        id: `msg_fsm_shop_${Date.now()}`,
        sender: "bot",
        text: "📝 **Добавление покупки в список**\n─────────────────────────\n✍️ Напишите название товара или продукта, который необходимо купить (например: `Багет хрустящий` или `Зубная паста`):",
        time,
        isFsmPrompt: true,
        inlineButtons: [[{ text: "🔙 Назад в меню", callbackId: "main_menu", style: "secondary" }]]
      };
      setChatMessages(prev => [...prev, prompt]);

    } else if (callbackId === "shop_clear_confirm") {
      const prompt: ChatMessage = {
        id: `msg_clear_conf_${Date.now()}`,
        sender: "bot",
        text: "⚠️ **Внимание: Полная очистка списка**\n─────────────────────────\nВы действительно хотите навсегда стереть ВСЕ товары из семейного списка?",
        time,
        inlineButtons: [
          [
            { text: "🚨 Да, очистить целиком", callbackId: "shop_clear_confirmed", style: "danger" },
            { text: "❌ Отмена", callbackId: "menu_shopping" }
          ]
        ]
      };
      setChatMessages(prev => [...prev, prompt]);

    } else if (callbackId === "shop_clear_confirmed") {
      setShoppingList([]);
      showToast("🧹 Список покупок полностью очищен в базе данных!");
      const feedback: ChatMessage = {
        id: `msg_cleared_${Date.now()}`,
        sender: "bot",
        text: "🧹 **Список покупок полностью очищен!**",
        time,
        inlineButtons: [[{ text: "🔙 Назад в меню", callbackId: "main_menu" }]]
      };
      setChatMessages(prev => [...prev, feedback]);

    } else if (callbackId.startsWith("shop_buy_")) {
      const itemId = parseInt(callbackId.replace("shop_buy_", ""));
      const item = shoppingList.find(i => i.id === itemId);
      if (item) {
        setShoppingList(prev => prev.filter(i => i.id !== itemId));
        showToast(`🟢 Поздравляем, '${item.item_name}' куплен и вычеркнут!`);
        const feedback: ChatMessage = {
          id: `msg_bought_fd_${Date.now()}`,
          sender: "bot",
          text: `🟢 Товар **"${item.item_name}"** вычеркнут и удален из базы!`,
          time
        };
        setChatMessages(prev => [...prev, feedback]);
        // Redraw list shortly after
        setTimeout(() => triggerShoppingView(getSimulatedTime()), 400);
      }

    } else if (callbackId === "menu_calendar") {
      triggerCalendarView(time);

    } else if (callbackId === "cal_add_init") {
      setBotFsm({ step: "waiting_for_cal_date", currentData: {} });
      const prompt: ChatMessage = {
        id: `msg_cal_date_${Date.now()}`,
        sender: "bot",
        text: "📅 **Новое Семейное Событие • Шаг 1 из 2**\n─────────────────────────\n✍️ Введите **дату** события (например, `24.05`, `30 Июня` или `Каждую пятницу`):",
        time,
        isFsmPrompt: true,
        inlineButtons: [[{ text: "🔙 Назад в меню", callbackId: "main_menu", style: "secondary" }]]
      };
      setChatMessages(prev => [...prev, prompt]);

    } else if (callbackId.startsWith("cal_del_")) {
      const evId = parseInt(callbackId.replace("cal_del_", ""));
      const ev = calendarEvents.find(e => e.id === evId);
      if (ev) {
        setCalendarEvents(prev => prev.filter(e => e.id !== evId));
        showToast("🗓 Событие удалено из Семейного Календаря!");
        const feedback: ChatMessage = {
          id: `msg_cal_del_${Date.now()}`,
          sender: "bot",
          text: `🗑 Событие **"${ev.event_text}"** удалено из календаря.`,
          time
        };
        setChatMessages(prev => [...prev, feedback]);
        setTimeout(() => triggerCalendarView(getSimulatedTime()), 400);
      }

    } else if (callbackId === "menu_duty") {
      triggerDutyView(time);

    } else if (callbackId === "duty_roll_dice") {
      // START THE REVOLUTIONARY ANIMATION SIMULATION
      setRollingActive(true);
      const rollMsgId = `roll_${Date.now()}`;
      
      const newRollPrompt: ChatMessage = {
        id: rollMsgId,
        sender: "bot",
        text: "🧹 **Дежурный по Дому**\n─────────────────────────\n🎲 **Кубик подлетает...**\n───◯───",
        time
      };
      setChatMessages(prev => [...prev, newRollPrompt]);

      // Stage 2
      setTimeout(() => {
        setChatMessages(prev => prev.map(m => {
          if (m.id === rollMsgId) {
            return { ...m, text: "🧹 **Дежурный по Дому**\n─────────────────────────\n✨ **Судьба перебирает варианты...**\n───●───" };
          }
          return m;
        }));
      }, 500);

      // Stage 3
      setTimeout(() => {
        setChatMessages(prev => prev.map(m => {
          if (m.id === rollMsgId) {
            return { ...m, text: "🧹 **Дежурный по Дому**\n─────────────────────────\n🧼 **Трём мыло и готовим щётки...**\n───◯───" };
          }
          return m;
        }));
      }, 1000);

      // Stage 4
      setTimeout(() => {
        setChatMessages(prev => prev.map(m => {
          if (m.id === rollMsgId) {
            return { ...m, text: "🧹 **Дежурный по Дому**\n─────────────────────────\n🌀 **Крутится барабан пылесоса...**\n───●───" };
          }
          return m;
        }));
      }, 1500);

      // Final Random Selection from registered users
      setTimeout(() => {
        const winner = users[Math.floor(Math.random() * users.length)];
        const winnerClean = winner === "@alex_family" ? "Алексей" : winner === "@maria_love" ? "Мария (Жена)" : "Татьяна Игоревна (Бабушка)";
        
        setChatMessages(prev => prev.map(m => {
          if (m.id === rollMsgId) {
            return {
              ...m,
              text: `🧹 **Дежурный по Дому • Жребий брошен!**\n─────────────────────────\n🎉 Барабанная дробь стихла...\n\n🧼 Нашим сегодняшним дежурным по дому назначается:\n👑 **${winnerClean} (${winner})**! 🧹🍳🍕\n\nЖелаем удачи и отличного настроения при наведении чистоты!`,
              inlineButtons: [
                [{ text: "🎲 Бросить жребий ещё раз!", callbackId: "duty_roll_dice" }],
                [{ text: "🔙 Назад в меню", callbackId: "main_menu", style: "secondary" }]
              ]
            };
          }
          return m;
        }));
        setRollingActive(false);
        showToast(`🧹 Жребий выбран! Дежурным назначен: ${winnerClean}`);
      }, 2000);
    }
  };

  const triggerShoppingView = (time: string) => {
    let body = "📝 **Семейный список покупок**\n─────────────────────────\n";
    let inlineBtns = [];

    if (shoppingList.length === 0) {
      body += "🛒 Список покупок в данный момент пуст! Всё куплено.";
      inlineBtns = [
        [{ text: "➕ Добавить товар", callbackId: "shop_add_init" }],
        [{ text: "🔙 Назад в меню", callbackId: "main_menu", style: "secondary" as const }]
      ];
    } else {
      body += "Вычеркивайте купленные товары кликом по ним:\n\n";
      shoppingList.forEach(item => {
        inlineBtns.push([
          {
            text: `❌ ${item.item_name} (от ${item.added_by})`,
            callbackId: `shop_buy_${item.id}`,
            style: "danger" as const
          }
        ]);
      });
      inlineBtns.push([
        { text: "➕ Добавить товар", callbackId: "shop_add_init", style: "primary" as const },
        { text: "🧹 Очистить всё", callbackId: "shop_clear_confirm", style: "danger" as const }
      ]);
      inlineBtns.push([{ text: "🔙 Назад в меню", callbackId: "main_menu", style: "secondary" as const }]);
    }

    const shMsg: ChatMessage = {
      id: `msg_shop_${Date.now()}`,
      sender: "bot",
      text: body,
      time,
      inlineButtons: inlineBtns
    };
    setChatMessages(prev => [...prev, shMsg]);
  };

  const triggerCalendarView = (time: string) => {
    let body = "📅 **Семейный Календарь & Важные Даты**\n─────────────────────────\n";
    let inlineBtns = [];

    if (calendarEvents.length === 0) {
      body += "⛱ Нет запланированных событий или важных дат! Добавьте новые, чтобы не забыть.";
      inlineBtns = [
        [{ text: "🗓 Добавить событие", callbackId: "cal_add_init" }],
        [{ text: "🔙 Назад в меню", callbackId: "main_menu", style: "secondary" as const }]
      ];
    } else {
      body += "Предстоящие дела и семейные праздники:\n\n";
      calendarEvents.forEach(ev => {
        body += `🔹 **[${ev.event_date}]** ${ev.event_text} _(от ${ev.added_by})_\n`;
        inlineBtns.push([
          {
            text: `🗑 Удалить: ${ev.event_text.substring(0, 15)}...`,
            callbackId: `cal_del_${ev.id}`,
            style: "danger" as const
          }
        ]);
      });
      inlineBtns.push([{ text: "🗓 Добавить событие", callbackId: "cal_add_init", style: "primary" as const }]);
      inlineBtns.push([{ text: "🔙 Назад в меню", callbackId: "main_menu", style: "secondary" as const }]);
    }

    const calMsg: ChatMessage = {
      id: `msg_cal_${Date.now()}`,
      sender: "bot",
      text: body,
      time,
      inlineButtons: inlineBtns
    };
    setChatMessages(prev => [...prev, calMsg]);
  };

  const triggerDutyView = (time: string) => {
    let family_members_list = "";
    users.forEach((username, idx) => {
      const cleanName = username === "@alex_family" ? "Алексей" : username === "@maria_love" ? "Мария (Жена)" : "Татьяна Игоревна (Бабушка)";
      family_members_list += `${idx + 1}. 👤 **${cleanName}** (${username})\n`;
    });

    const dutyText = (
      `🧹 **Дежурный по Дому • Выбор судьбы**\n` +
      `─────────────────────────\n` +
      `Надоело спорить, кто сегодня моет посуду, выносит мусор или убирает гостиную? ` +
      `Доверьте это авторитету беспристрастного великого жребия! 🎲\n\n` +
      `Список домашних участников:\n` +
      `${family_members_list}\n` +
      `─────────────────────────\n` +
      `Нажмите кнопку ниже, чтобы запустить анимированную крутилку судьбы!`
    );

    const dutyMsg: ChatMessage = {
      id: `msg_dt_${Date.now()}`,
      sender: "bot",
      text: dutyText,
      time,
      inlineButtons: [
        [{ text: "🎲 Бросить жребий!", callbackId: "duty_roll_dice" }],
        [{ text: "🔙 Назад в меню", callbackId: "main_menu", style: "secondary" }]
      ]
    };
    setChatMessages(prev => [...prev, dutyMsg]);
  };

  // Submit Text Input inside simulated Chat (represents user writing custom messages)
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userTextInput.trim() || rollingActive) return;

    const userText = userTextInput.trim();
    const time = getSimulatedTime();
    setUserTextInput("");

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: userText,
      time
    };

    setChatMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      processStateFlow(userText, time);
    }, 450);
  };

  const processStateFlow = (text: string, time: string) => {
    if (botFsm.step === "waiting_for_amount") {
      const amountClean = text.trim().replace(",", ".");
      const amount = parseFloat(amountClean);

      if (isNaN(amount) || amount <= 0) {
        const botError: ChatMessage = {
          id: `err_${Date.now()}`,
          sender: "bot",
          text: "⚠️ **Ошибка формата!**\nСумма расхода должна быть строго числом больше нуля. Пожалуйста, введите корректное число (например: `750` или `1240.50`):",
          time,
          isFsmPrompt: true
        };
        setChatMessages(prev => [...prev, botError]);
        return;
      }

      setBotFsm({
        step: "waiting_for_category",
        currentData: { amount }
      });

      const botPrompt: ChatMessage = {
        id: `fsm_cat_${Date.now()}`,
        sender: "bot",
        text: `💵 **Сумма:** ${amount.toLocaleString("ru-RU")} руб.\n─────────────────────────\n📂 **Добавление расхода • Шаг 2 из 3**\nВыделите одну из основных категорий расходов ниже:`,
        time,
        inlineButtons: [
          [
            { text: "🛒 Продукты", callbackId: "fin_cat_Продукты" },
            { text: "🔌 ЖКХ", callbackId: "fin_cat_ЖКХ" }
          ],
          [
            { text: "🚗 Машина", callbackId: "fin_cat_Машина" },
            { text: "📦 Другое", callbackId: "fin_cat_Другое" }
          ]
        ],
        isFsmPrompt: true
      };
      setChatMessages(prev => [...prev, botPrompt]);

    } else if (botFsm.step === "waiting_for_description") {
      const description = text.trim();
      const amount = botFsm.currentData.amount;
      const category = botFsm.currentData.category;

      const newExpense: Expense = {
        id: expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1,
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
        text: `✅ **Успешно записано!**\n─────────────────────────\n💵 **Сумма:** ${amount.toLocaleString("ru-RU")} руб.\n📂 **Категория:** ${category}\n📝 **Что взяли:** ${description}\n\nВсе данные зафиксированы в общей SQLite базе.`,
        time,
        inlineButtons: [
          [{ text: "📊 Показать бюджет", callbackId: "menu_finance" }],
          [{ text: "🔙 Назад в меню", callbackId: "main_menu", style: "secondary" }]
        ]
      };
      setChatMessages(prev => [...prev, botSuccess]);
      showToast("💾 SQLite: Добавлена новая запись в таблицу finance!");

    } else if (botFsm.step === "waiting_for_item") {
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
        text: `✅ Товар '**${item_name}**' записан в чек-лист покупки!`,
        time
      };
      setChatMessages(prev => [...prev, botSuccess]);
      showToast("💾 SQLite: Добавлена новая запись в таблицу shopping_list!");
      setTimeout(() => triggerShoppingView(getSimulatedTime()), 400);

    } else if (botFsm.step === "waiting_for_cal_date") {
      const event_date = text.trim();
      setBotFsm({
        step: "waiting_for_cal_text",
        currentData: { event_date }
      });

      const prompt: ChatMessage = {
        id: `prompt_cal_tx_${Date.now()}`,
        sender: "bot",
        text: `🗓 **Дата зарегистрирована:** ${event_date}\n─────────────────────────\n📅 **Новое Семейное Событие • Шаг 2 из 2**\n✍️ Напишите описание события (напр. 'День Рождения Папы 🎉' или 'Запись к стоматологу 🦷'):`,
        time,
        isFsmPrompt: true
      };
      setChatMessages(prev => [...prev, prompt]);

    } else if (botFsm.step === "waiting_for_cal_text") {
      const event_text = text.trim();
      const event_date = botFsm.currentData.event_date;

      const newEv: CalendarEvent = {
        id: calendarEvents.length > 0 ? Math.max(...calendarEvents.map(e => e.id)) + 1 : 1,
        event_text,
        event_date,
        added_by: MOCK_SELF.username
      };

      setCalendarEvents(prev => [...prev, newEv]);
      setBotFsm({ step: "idle", currentData: {} });

      const botSuccess: ChatMessage = {
        id: `success_cal_${Date.now()}`,
        sender: "bot",
        text: `✅ Событие на **${event_date}** успешно добавлено в Семейный Календарь!`,
        time
      };
      setChatMessages(prev => [...prev, botSuccess]);
      showToast("💾 SQLite: Записано новое событие в таблицу calendar!");
      setTimeout(() => triggerCalendarView(getSimulatedTime()), 400);

    } else {
      // Default help text if user sends standard text
      const reply = `🤖 **Семейный Помощник**\n─────────────────────────\nЯ работаю исключительно по интерактивному меню. Пожалуйста, воспользуйтесь кнопками ниже, чтобы управлять бюджетом, списком покупок, календарем семейных дел или жребием! 🎲`;
      setChatMessages(prev => [...prev, {
        id: `msg_def_${Date.now()}`,
        sender: "bot",
        text: reply,
        time,
        inlineButtons: getMainMenuInlineButtons()
      }]);
    }
  };

  // Fast testing injection buttons (Simulating wife actions)
  const injectWifeExpense = () => {
    const itemsMock = [
      { amount: 1680, cat: "Продукты", desc: "Гипермаркет Ашан (сыр, фрукты, кофе)" },
      { amount: 750, cat: "Другое", desc: "Детские книги и краски" },
      { amount: 5200, cat: "ЖКХ", desc: "Отопление и горячая вода" },
      { amount: 3100, cat: "Машина", desc: "Мойка люкс и химчистка салона" }
    ][Math.floor(Math.random() * 4)];

    const wifeExpense: Expense = {
      id: expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1,
      telegram_id: MOCK_WIFE.id,
      amount: itemsMock.amount,
      category: itemsMock.cat,
      description: itemsMock.desc,
      date: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    setExpenses(prev => [wifeExpense, ...prev]);
    showToast(`👩 Жена (${MOCK_WIFE.name}) добавила покупку на сумму ${itemsMock.amount} руб.!`);

    // Add inline event alert
    const time = getSimulatedTime();
    const notification: ChatMessage = {
      id: `notif_${Date.now()}`,
      sender: "bot",
      text: `📢 **Новая запись от ${MOCK_WIFE.username}:**\n👩 Добавлен расход на **${itemsMock.amount.toLocaleString("ru-RU")} руб.**\n📂 Категория: *${itemsMock.cat}*\n📝 Описание: *${itemsMock.desc}*`,
      time
    };
    setChatMessages(prev => [...prev, notification]);
  };

  const injectWifeShopping = () => {
    const productsMock = [
      "Сливки 10% для кофе 🍼",
      "Клубника свежая 500г 🍓",
      "Таблетки для посудомойки Finish 🍽️",
      "Зелёный чай Basilur 🍃",
      "Свежий салмон филе 🐟"
    ];
    const randomProduct = productsMock[Math.floor(Math.random() * productsMock.length)];

    const newItem: ShoppingItem = {
      id: shoppingList.length > 0 ? Math.max(...shoppingList.map(o => o.id)) + 1 : 1,
      item_name: randomProduct,
      added_by: MOCK_WIFE.username
    };

    setShoppingList(prev => [...prev, newItem]);
    showToast(`👩 Жена (${MOCK_WIFE.name}) добавила "${randomProduct}" в список покупок!`);

    const time = getSimulatedTime();
    const notification: ChatMessage = {
      id: `notif_${Date.now()}`,
      sender: "bot",
      text: `📢 **${MOCK_WIFE.username} добавила товар в список:**\n👉 **${randomProduct}**`,
      time
    };
    setChatMessages(prev => [...prev, notification]);
  };

  const injectGrandmaCalendar = () => {
    const eventsMock = [
      { title: "🎂 Юбилей дедушки 🎈", date: "15 Июля" },
      { title: "Забрать кулич от кондитера 🧁", date: "31 Мая" },
      { title: "Полить цветы на даче 🌸", date: "Каждые выхи" }
    ];
    const item = eventsMock[Math.floor(Math.random() * eventsMock.length)];

    const newEv: CalendarEvent = {
      id: calendarEvents.length > 0 ? Math.max(...calendarEvents.map(e => e.id)) + 1 : 1,
      event_text: item.title,
      event_date: item.date,
      added_by: MOCK_GRANDMA.username
    };

    setCalendarEvents(prev => [...prev, newEv]);
    showToast(`👵 Бабушка внесла событие "${item.title}" в календарь!`);

    const time = getSimulatedTime();
    const notification: ChatMessage = {
      id: `notif_${Date.now()}`,
      sender: "bot",
      text: `📢 **${MOCK_GRANDMA.username} добавила напоминание:**\n📅 **[${item.date}]** *${item.title}*`,
      time
    };
    setChatMessages(prev => [...prev, notification]);
  };

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
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-45 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-xl shadow-lg ring-1 ring-white/10">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 flex-wrap">
                Семейный Центр Управления
                <span className="text-xs font-mono px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
                  aiogram 2.25.1 + SQLite3
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Модульная, чистая 3-файловая архитектура бота с быстрым запуском на Android через Termux
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-slate-400">
              Среда запуска: <strong className="text-indigo-400">Termux @ Python 3.13</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Area - Code, Manual, Architecture (7 Columns) */}
        <section className="lg:col-span-7 flex flex-col gap-6" id="developer_panel">
          
          {/* Navigation Control Toolbar */}
          <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl flex gap-1 shadow-inner">
            <button
              id="tab_code"
              onClick={() => setActiveTab("code")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-xs md:text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
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
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-xs md:text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
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
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-xs md:text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                activeTab === "structure"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Database className="h-4 w-4" />
              Таблицы БД
            </button>
          </div>

          {/* Tab Content Display Container */}
          <div className="flex-1 flex flex-col">
            
            {/* TAB 1: CODE EXHIBIT */}
            {activeTab === "code" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl flex-1">
                {/* File selectors */}
                <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 max-w-full overflow-x-auto">
                    <button
                      id="sel_db"
                      onClick={() => setActiveFile("database")}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors shrink-0 cursor-pointer ${
                        activeFile === "database"
                          ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      database.py
                    </button>
                    <button
                      id="sel_handlers"
                      onClick={() => setActiveFile("handlers")}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors shrink-0 cursor-pointer ${
                        activeFile === "handlers"
                          ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      handlers.py
                    </button>
                    <button
                      id="sel_bot"
                      onClick={() => setActiveFile("bot")}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors shrink-0 cursor-pointer ${
                        activeFile === "bot"
                          ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      bot.py
                    </button>
                    <button
                      id="sel_req"
                      onClick={() => setActiveFile("requirements")}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors shrink-0 cursor-pointer ${
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
                        handlers: HANDLERS_CODE,
                        requirements: REQUIREMENTS_CODE
                      };
                      const filenameMap = {
                        bot: "bot.py",
                        database: "database.py",
                        handlers: "handlers.py",
                        requirements: "requirements.txt"
                      };
                      handleCopyCode(filenameMap[activeFile], textMap[activeFile]);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/15 hover:bg-slate-850 border-indigo-500/30 text-indigo-300 hover:text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200"
                  >
                    {copiedFile ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-mono">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Копировать</span>
                      </>
                    )}
                  </button>
                </div>

                {/* File description tag */}
                <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-850 text-[11px] text-slate-400 flex items-start gap-2 text-left">
                  <span className="font-semibold text-slate-300 shrink-0">Файл:</span>
                  <span>
                    {activeFile === "bot" && "Точка входа (bot.py) - настраивает чистую инициализацию Bot, Dispatcher и MemoryStorage."}
                    {activeFile === "handlers" && "Интерактивная логика (handlers.py) - обрабатывает меню, кастомные FSM-переходы и красивый крутящийся жребий."}
                    {activeFile === "database" && "Базовая SQLite (database.py) - регистрирует членов семьи, ведет календарь событий, считает лимиты расходов."}
                    {activeFile === "requirements" && "Каталог зависимостей для корректного развёртывания бота в окружении Termux."}
                  </span>
                </div>

                {/* Main Code Viewer Body */}
                <div className="flex-1 overflow-auto max-h-[550px] font-mono text-[11px] leading-relaxed bg-slate-950 p-4 text-slate-300">
                  <pre className="relative select-text whitespace-pre overflow-x-auto text-left">
                    <code>
                      {(activeFile === "bot" ? BOT_CODE : activeFile === "database" ? DATABASE_CODE : activeFile === "handlers" ? HANDLERS_CODE : REQUIREMENTS_CODE)
                        .split("\n")
                        .map((line, idx) => (
                          <div key={idx} className="table-row hover:bg-slate-900/40">
                            <span className="table-cell text-slate-600 pr-3 select-none text-right w-8 border-r border-slate-800/40 mr-3">
                              {idx + 1}
                            </span>
                            <span className="table-cell pl-3 whitespace-pre-wrap">{line}</span>
                          </div>
                        ))}
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 2: TERMUX STEP-BY-STEP MANUAL */}
            {activeTab === "termux" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl flex-1 flex flex-col gap-4 text-left">
                <div>
                  <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-indigo-400" />
                    Запуск бота на Android в приложении Termux
                  </h3>
                  <p className="text-xs text-slate-400">
                    Подробное пошаговое руководство для запуска. База SQLite настраивается автоматически при первом запуске!
                  </p>
                </div>

                <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                  {/* Step 1 */}
                  <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-850 flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="font-semibold text-slate-200 text-xs">Установите Termux с F-Droid</h4>
                      <p className="text-[11px] text-slate-450 leading-relaxed">
                        ⚠️ Скачайте официальный стабильный `.apk` со свободной площадки <strong>F-Droid</strong>. В Google Play версия не обновляется.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-850 flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="font-semibold text-slate-200 text-xs">Обновите системные репозитории</h4>
                      <p className="text-[11px] text-slate-450 leading-relaxed">
                        Вставьте команду. При запросе выбора (Y/N) нажимайте кнопку <strong>Enter</strong> для согласия:
                      </p>
                      <div className="bg-slate-900 rounded-lg p-2.5 flex items-center justify-between border border-slate-800 font-mono text-[11px]">
                        <span className="text-emerald-400">pkg update && pkg upgrade -y</span>
                        <button
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText("pkg update && pkg upgrade -y");
                              showToast("Команда скопирована!");
                            }
                          }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-850 flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="font-semibold text-slate-200 text-xs">Установите Python, Git и SQLite</h4>
                      <div className="bg-slate-900 rounded-lg p-2.5 flex items-center justify-between border border-slate-800 font-mono text-[11px]">
                        <span className="text-emerald-400">pkg install python git sqlite3 -y</span>
                        <button
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText("pkg install python git sqlite3 -y");
                              showToast("Команда скопирована!");
                            }
                          }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-850 flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      4
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="font-semibold text-slate-200 text-xs">Создайте каталог и скопируйте файлы</h4>
                      <p className="text-[11px] text-slate-450 leading-relaxed">
                        Создайте папку <code>family_bot</code> и поместите туда три файла: <code>bot.py</code>, <code>database.py</code> и <code>requirements.txt</code>.
                      </p>
                      <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                        <div>mkdir -p ~/family_bot && cd ~/family_bot</div>
                        <div>nano database.py <span className="text-slate-600"># Вставить код database.py</span></div>
                        <div>nano handlers.py <span className="text-slate-600"># Вставить код handlers.py</span></div>
                        <div>nano bot.py <span className="text-slate-600"># Вставить код bot.py</span></div>
                        <div>nano requirements.txt</div>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-850 flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      5
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="font-semibold text-slate-200 text-xs">Установите библиотеки и запустите в фоне!</h4>
                      <p className="text-[11px] text-slate-450 leading-relaxed">
                        Потребуется скачать библиотеки `aiogram` и запускать скрипт через nohup, чтобы бот не отключался после закрытия сессии:
                      </p>
                      <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-850 font-mono text-[10.5px] leading-relaxed text-slate-450 text-left">
                        <div>pip install -r requirements.txt</div>
                        <div className="text-emerald-400 mt-1">export BOT_TOKEN='your_telegram_token'</div>
                        <div className="text-emerald-400">nohup python bot.py &gt; log.txt 2&gt;&amp;1 &amp;</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SQL TABLES & STRUCTURE */}
            {activeTab === "structure" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl flex-1 flex flex-col gap-5 text-left">
                <div>
                  <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                    <Database className="h-5 w-5 text-indigo-400" />
                    База данных SQLite (таблицы в семейной схеме)
                  </h3>
                  <p className="text-xs text-slate-400 font-light">
                    Реляционная база данных <code>family.db</code> инициализируется автоматически при первом запуске!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Table: Users */}
                  <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                    <span className="text-[9px] text-indigo-400 font-mono uppercase font-bold tracking-wider">Пользователи</span>
                    <h4 className="font-bold text-slate-100 mt-0.5 mb-2 font-mono text-xs">Table: users</h4>
                    <div className="space-y-1 font-mono text-[11px] text-slate-400">
                      <div className="flex justify-between border-b border-slate-900 pb-0.5">
                        <span className="text-slate-200">telegram_id</span>
                        <span>INTEGER PRIMARY KEY</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-0.5">
                        <span className="text-slate-200">username</span>
                        <span>TEXT</span>
                      </div>
                      <div className="flex justify-between pb-0.5">
                        <span className="text-slate-200">role</span>
                        <span>TEXT DEFAULT 'family_member'</span>
                      </div>
                    </div>
                  </div>

                  {/* Table: Shopping List */}
                  <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                    <span className="text-[9px] text-indigo-400 font-mono uppercase font-bold tracking-wider">Список покупок</span>
                    <h4 className="font-bold text-slate-100 mt-0.5 mb-2 font-mono text-xs">Table: shopping_list</h4>
                    <div className="space-y-1 font-mono text-[11px] text-slate-400">
                      <div className="flex justify-between border-b border-slate-900 pb-0.5">
                        <span className="text-slate-200">id</span>
                        <span>INTEGER PRIMARY KEY (AUTO_INC)</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-0.5">
                        <span className="text-slate-200">item_name</span>
                        <span>TEXT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-200">added_by</span>
                        <span>TEXT</span>
                      </div>
                    </div>
                  </div>

                  {/* Table: Finance */}
                  <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                    <span className="text-[9px] text-indigo-400 font-mono uppercase font-bold tracking-wider">Семейный Бюджет</span>
                    <h4 className="font-bold text-slate-100 mt-0.5 mb-2 font-mono text-xs">Table: finance</h4>
                    <div className="space-y-1 font-mono text-[11px] text-slate-400">
                      <div className="flex justify-between border-b border-slate-900 pb-0.5">
                        <span className="text-slate-200">id</span>
                        <span>INTEGER PRIMARY KEY</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-0.5">
                        <span className="text-slate-200">telegram_id</span>
                        <span>INTEGER</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-0.5">
                        <span className="text-slate-200">amount</span>
                        <span>REAL</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-0.5">
                        <span className="text-slate-200">category</span>
                        <span>TEXT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-200">description</span>
                        <span>TEXT</span>
                      </div>
                    </div>
                  </div>

                  {/* Table: Calendar */}
                  <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                    <span className="text-[9px] text-indigo-400 font-mono uppercase font-bold tracking-wider">Календарь дат</span>
                    <h4 className="font-bold text-slate-100 mt-0.5 mb-2 font-mono text-xs">Table: calendar</h4>
                    <div className="space-y-1 font-mono text-[11px] text-slate-400">
                      <div className="flex justify-between border-b border-slate-900 pb-0.5">
                        <span className="text-slate-200">id</span>
                        <span>INTEGER PRIMARY KEY</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-0.5">
                        <span className="text-slate-200">event_text</span>
                        <span>TEXT</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-0.5">
                        <span className="text-slate-200">event_date</span>
                        <span>TEXT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-200">added_by</span>
                        <span>TEXT</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DB Status Inspector Mock */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 flex flex-col gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <Database className="h-4 w-4 text-emerald-400 animate-pulse" />
                      <span className="text-xs font-semibold text-slate-300">Инспектор Live-SQLite базы данных</span>
                    </div>
                    <button
                      onClick={() => {
                        setExpenses([
                          { id: 1, telegram_id: 777002, amount: 1550, category: "Продукты", description: "Супермаркет Окей", date: "2026-05-24 10:15:00" },
                          { id: 2, telegram_id: 777001, amount: 2400, category: "Машина", description: "Заправка АИ-95 Лукойл", date: "2026-05-24 11:30:00" },
                        ]);
                        setShoppingList([
                          { id: 1, item_name: "Молоко 2.5% Домик в деревне", added_by: "@maria_love" },
                          { id: 2, item_name: "Сыр Ламбер 350г", added_by: "@maria_love" },
                        ]);
                        setCalendarEvents([
                          { id: 1, event_text: "День Рождения Мамы 🎉", event_date: "30 Июня", added_by: "@maria_love" },
                        ]);
                        showToast("Локальный симулятор базы данных сброшен к начальным!");
                      }}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2.5 py-1 rounded border border-slate-800"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Сбросить данные
                    </button>
                  </div>

                  <div className="text-[11px] space-y-3 font-mono text-left">
                    <div>
                      <span className="text-slate-500 font-semibold">🔍 SELECT * FROM finance; (всего строк: {expenses.length})</span>
                      <div className="max-h-24 overflow-y-auto mt-1 p-2 bg-slate-900 rounded border border-slate-850/60 space-y-1">
                        {expenses.map(e => (
                          <div key={e.id} className="text-slate-400 flex justify-between gap-4 text-[10px]">
                            <span>{e.id}. User_id:{e.telegram_id.toString().substring(3)} | {e.amount}р → {e.category} ({e.description})</span>
                            <span className="text-slate-650 text-[9px]">{e.date.split(" ")[1] || "Just now"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-semibold">🔍 SELECT * FROM shopping_list; (всего строк: {shoppingList.length})</span>
                      <div className="max-h-24 overflow-y-auto mt-1 p-2 bg-slate-900 rounded border border-slate-850/60 space-y-1">
                        {shoppingList.map(s => (
                          <div key={s.id} className="text-slate-400 flex justify-between gap-4 text-[10px]">
                            <span>{s.id}. **{s.item_name}**</span>
                            <span className="text-slate-550 text-[10px]">{s.added_by}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-semibold">🔍 SELECT * FROM calendar; (всего строк: {calendarEvents.length})</span>
                      <div className="max-h-24 overflow-y-auto mt-1 p-2 bg-slate-900 rounded border border-slate-850/60 space-y-1">
                        {calendarEvents.map(c => (
                          <div key={c.id} className="text-slate-400 flex justify-between gap-4 text-[10px]">
                            <span>{c.id}. [{c.event_date}] **{c.event_text}**</span>
                            <span className="text-slate-550 text-[10px]">{c.added_by}</span>
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
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-rose-500 animate-pulse fill-rose-500" />
                Панель совместного семейного доступа
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Поскольку общая база данных <strong>family.db</strong> хранится на сервере, она мгновенно обновляется другими членами семьи. Симулируйте внешние события:
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                id="inject_expense"
                onClick={injectWifeExpense}
                className="py-1.5 px-2 bg-rose-950/45 hover:bg-rose-900/40 text-rose-300 border border-rose-900/40 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Coins className="h-3 w-3" />
                Жена: Трата
              </button>
              <button
                id="inject_shopping"
                onClick={injectWifeShopping}
                className="py-1.5 px-2 bg-emerald-950/45 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-900/40 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <ShoppingBag className="h-3 w-3" />
                Жена: Купить товар
              </button>
              <button
                id="inject_grandma"
                onClick={injectGrandmaCalendar}
                className="py-1.5 px-2 bg-indigo-950/45 hover:bg-indigo-900/40 text-indigo-300 border border-indigo-900/40 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Calendar className="h-3 w-3" />
                Бабушка: Календарь
              </button>
            </div>
          </div>

          {/* Core Telegram Smartphone Frame */}
          <div className="w-full max-w-[380px] mx-auto bg-slate-950 border border-slate-800 rounded-[38px] p-3 shadow-2xl ring-12 ring-slate-900 relative">
            
            {/* Camera notch */}
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-28 h-4.5 bg-slate-950 rounded-full z-20 flex items-center justify-center">
              <div className="w-3.5 h-3.5 bg-slate-900 rounded-full border border-slate-800 mr-2" />
              <div className="w-1.5 h-1.5 bg-indigo-950 rounded-full" />
            </div>

            {/* Simulated Phone Screen Container */}
            <div className="bg-slate-900 w-full rounded-[30px] overflow-hidden flex flex-col h-[540px] border border-slate-800 text-left relative">
              
              {/* Telegram Header */}
              <div className="bg-slate-950/95 pt-6 pb-2.5 px-4 flex items-center gap-3 border-b border-slate-850 shrink-0 z-10">
                <div className="h-8.5 w-8.5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-md">
                  СЦ
                </div>
                <div className="text-left">
                  <div className="text-[12px] font-bold text-slate-100 flex items-center gap-1.5 leading-tight">
                    Семейный Центр Бот
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[9px] text-slate-500 leading-none">@Family_HUB_bot</div>
                </div>
              </div>

              {/* Chat Window with bubbles */}
              <div className="flex-1 overflow-y-auto px-3 py-3.5 bg-slate-900/95 space-y-3.5 flex flex-col scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <div className="text-center">
                  <span className="text-[9px] font-semibold bg-slate-950/70 px-2.5 py-0.5 rounded-full text-slate-500 font-mono">
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
                      className={`p-3 rounded-2xl text-[12px] leading-relaxed shadow-md ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-tr-none text-right"
                          : msg.isFsmPrompt
                          ? "bg-slate-950 text-indigo-300 border border-indigo-500/20 rounded-tl-none ring-1 ring-indigo-500/10 text-left"
                          : "bg-slate-950 text-slate-200 border border-slate-850 rounded-tl-none text-left"
                      }`}
                    >
                      <p className="whitespace-pre-line text-xs font-normal text-left">{msg.text}</p>
                      <div className={`text-[8px] mt-1 text-right font-mono ${msg.sender === "user" ? "text-indigo-200" : "text-slate-500"}`}>
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
                                disabled={rollingActive}
                                onClick={() => handleCallbackQuery(btn.callbackId)}
                                className={`flex-1 py-1.5 px-2 text-center text-[10.5px] font-semibold rounded-lg border transition-all duration-150 shrink-0 ${
                                  rollingActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                } ${
                                  btn.style === "danger"
                                    ? "bg-rose-950/50 hover:bg-rose-900/30 text-rose-300 border-rose-900/45"
                                    : btn.style === "primary"
                                    ? "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-700 font-bold"
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
                    <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2.5 py-0.5 rounded-full animate-pulse">
                      Фреймворк FSM: waiting_for_{botFsm.step.split("waiting_for_")[1]}
                    </span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Bot Bottom Input Area */}
              <div className="p-2 bg-slate-950/90 border-t border-slate-850 leading-none shrink-0 space-y-1.5 flex flex-col">
                <form onSubmit={handleSendMessage} className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    disabled={rollingActive}
                    value={userTextInput}
                    onChange={(e) => setUserTextInput(e.target.value)}
                    placeholder={
                      botFsm.step === "waiting_for_amount"
                        ? "Введите сумму (напр., 750)..."
                        : botFsm.step === "waiting_for_category"
                        ? "Выберите категорию расходов ниже..."
                        : botFsm.step === "waiting_for_description"
                        ? "Зачем потратили деньги?..."
                        : botFsm.step === "waiting_for_item"
                        ? "Название товара в список..."
                        : botFsm.step === "waiting_for_cal_date"
                        ? "Дату (например, 31 Мая)..."
                        : botFsm.step === "waiting_for_cal_text"
                        ? "Что за событие произойдет?..."
                        : "Напишите сообщение..."
                    }
                    className="flex-1 bg-slate-900 text-slate-200 border border-slate-850 rounded-xl px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-55"
                  />
                  <button
                    type="submit"
                    disabled={rollingActive}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition disabled:opacity-55"
                  >
                    Ввод
                  </button>
                </form>

                {/* Simulated Telegram Bottom Command Fast Menu */}
                <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-900">
                  <button
                    id="btn_sim_menu"
                    type="button"
                    disabled={rollingActive}
                    onClick={() => handleCallbackQuery("main_menu")}
                    className="py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 active:bg-slate-850 rounded-lg text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                    🏠 Главный Хаб
                  </button>
                  <button
                    id="btn_sim_shopping"
                    type="button"
                    disabled={rollingActive}
                    onClick={() => handleCallbackQuery("menu_shopping")}
                    className="py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 active:bg-slate-800/80 rounded-lg text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
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
            Разработано с заботой о семейном уюте <Heart className="h-3 w-3 text-red-550 fill-red-550" />
          </p>
        </div>
      </footer>
    </div>
  );
}
