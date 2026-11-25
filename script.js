(function () {
  const STORAGE_KEY = "project1_theme";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1. Theme Persistence & Switcher
  const themeDots = document.querySelectorAll(".theme-dot");
  const savedTheme = localStorage.getItem(STORAGE_KEY) || "aurora";

  function applyTheme(themeName) {
    document.body.setAttribute("data-theme", themeName);
    themeDots.forEach((dot) => {
      dot.classList.toggle("active", dot.dataset.set === themeName);
    });
  }

  applyTheme(savedTheme);

  themeDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const selected = dot.dataset.set;
      localStorage.setItem(STORAGE_KEY, selected);
      applyTheme(selected);
    });
  });

  // 2. Live Local Clock
  const clockEl = document.getElementById("local-clock");
  if (clockEl) {
    const updateClock = () => {
      clockEl.textContent = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  // 3. 3D Card Tilt & Cursor Spotlight
  const card = document.getElementById("tilt-card");
  if (card) {
    window.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
      card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);

      if (prefersReducedMotion) return;

      // Subtle tilt (disabled when user is typing in form inputs)
      const activeTag = document.activeElement && document.activeElement.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") {
        card.style.transform = "rotateX(0deg) rotateY(0deg)";
        return;
      }

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);

      const rotateX = Math.max(-5, Math.min(5, -deltaY * 4.5));
      const rotateY = Math.max(-5, Math.min(5, deltaX * 4.5));
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    window.addEventListener("mouseleave", () => {
      card.style.transform = "rotateX(0deg) rotateY(0deg)";
    });
  }

  // 4. Interactive Constellation & Sparkle Burst Canvas
  const canvas = document.getElementById("constellation");
  const sparkles = [];

  function spawnBurst(originX, originY) {
    const colors = ["#818cf8", "#f472b6", "#38bdf8", "#facc15", "#34d399"];
    for (let i = 0; i < 42; i++) {
      const angle = (Math.PI * 2 * i) / 42 + (Math.random() - 0.5) * 0.3;
      const speed = Math.random() * 5.5 + 2;
      sparkles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        life: 1,
        decay: Math.random() * 0.016 + 0.012,
        size: Math.random() * 3.5 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }
  window.spawnBurst = spawnBurst;

  if (canvas) {
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = Math.min(65, Math.floor((width * height) / 22000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 1.8 + 0.8
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      const isDaylight = document.body.getAttribute("data-theme") === "daylight";
      const dotColor = isDaylight ? "rgba(79, 70, 229, 0.35)" : "rgba(255, 255, 255, 0.42)";

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const alpha = (1 - dist / 130) * (isDaylight ? 0.14 : 0.16);
            ctx.strokeStyle = isDaylight
              ? `rgba(79, 70, 229, ${alpha})`
              : `rgba(148, 163, 184, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.09;
        s.life -= s.decay;

        if (s.life <= 0) {
          sparkles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = s.life;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = s.color;
        ctx.fill();
        ctx.restore();
      }

      if (!prefersReducedMotion) {
        requestAnimationFrame(animate);
      }
    }
    animate();
  }

  // 5. Home Page Controls
  const langBtn = document.getElementById("lang-btn");
  if (langBtn) {
    const greetings = [
      { lang: "English · Standard", text: "Hello, World!" },
      { lang: "Español · Spanish", text: "¡Hola, Mundo!" },
      { lang: "日本語 · Japanese", text: "こんにちは、世界！" },
      { lang: "Français · French", text: "Bonjour, le Monde !" },
      { lang: "हिन्दी · Hindi", text: "नमस्ते, दुनिया!" },
      { lang: "한국어 · Korean", text: "안녕하세요, 세계!" },
      { lang: "Italiano · Italian", text: "Ciao, Mondo!" },
      { lang: "Deutsch · German", text: "Hallo, Welt!" }
    ];
    let currentIdx = 0;
    const greetingEl = document.getElementById("greeting-text");
    const langLabelEl = document.getElementById("lang-label");
    const codeGreetingEl = document.getElementById("code-greeting");

    langBtn.addEventListener("click", () => {
      currentIdx = (currentIdx + 1) % greetings.length;
      greetingEl.classList.add("fade-swap");
      langLabelEl.style.opacity = "0";

      setTimeout(() => {
        const item = greetings[currentIdx];
        greetingEl.textContent = item.text;
        langLabelEl.textContent = item.lang;
        codeGreetingEl.textContent = `"${item.text}"`;
        greetingEl.classList.remove("fade-swap");
        langLabelEl.style.opacity = "1";
      }, 200);
    });
  }

  const sparkBtn = document.getElementById("spark-btn");
  if (sparkBtn) {
    sparkBtn.addEventListener("click", (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
  }

  // 6. Contact Page Controls
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    const chips = document.querySelectorAll(".topic-chip");
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("selected"));
        chip.classList.add("selected");
      });
    });

    const msgInput = document.getElementById("message");
    const charCount = document.getElementById("char-count");
    if (msgInput && charCount) {
      msgInput.addEventListener("input", () => {
        charCount.textContent = `${msgInput.value.length} / 500`;
      });
    }

    const toast = document.getElementById("form-toast");
    const submitBtn = document.getElementById("submit-btn");

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const rect = submitBtn.getBoundingClientRect();
      spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);

      if (toast) {
        const sender = document.getElementById("name").value.trim() || "Friend";
        toast.querySelector("span:last-child").textContent =
          `Thanks, ${sender}! Your message has been sent into the constellation.`;
        toast.classList.add("visible");
      }
      contactForm.reset();
      if (charCount) charCount.textContent = "0 / 500";
    });

    const copyBtn = document.getElementById("copy-email-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const email = "hello@project-one.dev";
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).catch(() => {});
        }
        const original = copyBtn.textContent;
        copyBtn.textContent = "✓ Copied!";
        setTimeout(() => {
          copyBtn.textContent = original;
        }, 1800);
      });
    }
  }
})();
