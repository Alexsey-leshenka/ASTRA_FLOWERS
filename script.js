document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const menuPanel = document.getElementById("menuPanel");
  const asortimentToggle = document.getElementById("asortimentToggle");
  const asortimentList = document.getElementById("asortimentList");
  const categoryToggle = document.getElementById("categoryToggle");
  const categoryList = document.getElementById("categoryList");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const productCards = document.querySelectorAll(".product-card");
  

  if (!menuToggle || !menuPanel || !categoryToggle || !categoryList || !asortimentToggle || !asortimentList) {
    console.error("Не найдены необходимые элементы меню.");
    return;
  }

  // Хранилище текущих активных фильтров
  const activeFilters = {
    category: "all",
    priceRange: "all"
  };

  // Перезапуск анимации карточки при её появлении
  function triggerCardAnimation(card) {
    card.style.animation = "none";
    void card.offsetWidth;
    card.style.animation = "";
  }

  // Главная функция комплексной фильтрации
  function applyCombinedFilter() {
    productCards.forEach((card) => {
      // 1. Проверка по категории
      const cardCategory = card.dataset.category;
      const matchesCategory = activeFilters.category === "all" || cardCategory === activeFilters.category;

      // 2. Проверка по цене
      const priceText = card.querySelector(".price")?.textContent || "";
      const price = parseInt(priceText.replace(/\s/g, ""), 10);
      
      let matchesPrice = true;
      if (activeFilters.priceRange !== "all") {
        const [min, max] = activeFilters.priceRange.split("-").map(Number);
        matchesPrice = price >= min && price <= max;
      }

      // Карточка видна, только если выполняются оба условия
      const isVisible = matchesCategory && matchesPrice;
      card.hidden = !isVisible;

      if (isVisible) {
            card.classList.remove("is-hidden");
            triggerCardAnimation(card);
        } else {
            card.classList.add("is-hidden");
        }
    });

    // Опционально: выводим сообщение, если ничего не найдено
    toggleEmptyState();
  }

  // Показывает уведомление, если под выбранные фильтры не подошел ни один букет
  function toggleEmptyState() {
    let emptyNotice = document.getElementById("catalogEmptyNotice");
    const visibleCards = Array.from(productCards).filter(card => !card.classList.contains("is-hidden"));

    if (visibleCards.length === 0) {
      if (!emptyNotice) {
        emptyNotice = document.createElement("p");
        emptyNotice.id = "catalogEmptyNotice";
        emptyNotice.style.textAlign = "center";
        emptyNotice.style.gridColumn = "1 / -1";
        emptyNotice.style.color = "var(--muted)";
        emptyNotice.style.padding = "40px 0";
        emptyNotice.innerHTML = `Букетов с такими параметрами сейчас нет.<br><button id="resetFiltersBtn" style="background:none; border:none; text-decoration:underline; color:var(--ink); cursor:pointer; margin-top:10px;">Сбросить фильтры</button>`;
        document.querySelector(".product-grid").appendChild(emptyNotice);
        
        document.getElementById("resetFiltersBtn").addEventListener("click", resetAllFilters);
      }
    } else if (emptyNotice) {
      emptyNotice.remove();
    }
  }

  // Сброс всех фильтров в исходное состояние
  function resetAllFilters() {
    activeFilters.category = "all";
    activeFilters.priceRange = "all";

    filterButtons.forEach(btn => {
      const isAll = btn.dataset.filter === "all";
      btn.classList.toggle("active", isAll);
      if (btn.classList.contains("filter-button")) {
        btn.setAttribute("aria-pressed", String(isAll));
      }
    });

    applyCombinedFilter();
  }

  // Подсветка кнопок внутри конкретного контейнера (меню или каталога)
  function updateButtonStyles(container, activeValue) {
    const buttons = container.querySelectorAll("[data-filter]");
    buttons.forEach((button) => {
      const isActive = button.dataset.filter === activeValue;
      button.classList.toggle("active", isActive);
      if (button.classList.contains("filter-button")) {
        button.setAttribute("aria-pressed", String(isActive));
      }
    });
  }

  // Управление поведением плавающих панелей
  function setMenuOpen(open) {
    menuToggle.setAttribute("aria-expanded", String(open));
    menuPanel.classList.toggle("is-open", open);
    menuPanel.inert = !open;
    document.body.classList.toggle("menu-open", open);
    if (!open) {
      setCategoriesOpen(false);
      setAsortimentOpen(false);
    }
  }

  function setAsortimentOpen(open) {
    asortimentToggle.setAttribute("aria-expanded", String(open));
    asortimentList.classList.toggle("is-open", open);
    asortimentList.inert = !open;
  }

  function setCategoriesOpen(open) {
    categoryToggle.setAttribute("aria-expanded", String(open));
    categoryList.classList.toggle("is-open", open);
    categoryList.inert = !open;
  }

  menuToggle.addEventListener("click", () => setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true"));
  asortimentToggle.addEventListener("click", () => setAsortimentOpen(asortimentToggle.getAttribute("aria-expanded") !== "true"));
  categoryToggle.addEventListener("click", () => setCategoriesOpen(categoryToggle.getAttribute("aria-expanded") !== "true"));

  // Обработка кликов по кнопкам фильтрации
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filterValue = button.dataset.filter;
      const isPriceFilter = filterValue.includes("-");

      if (isPriceFilter) {
        // Клик по фильтру цен
        activeFilters.priceRange = activeFilters.priceRange === filterValue ? "all" : filterValue;
        updateButtonStyles(asortimentList, activeFilters.priceRange);
      } else {
        // Клик по категориям (в каталоге или в выпадающем меню)
        activeFilters.category = activeFilters.category === filterValue && filterValue !== "all" ? "all" : filterValue;
        
        // Синхронизируем кнопки категорий и в каталоге, и в меню
        updateButtonStyles(document.getElementById("catalog") || document, activeFilters.category);
        updateButtonStyles(categoryList, activeFilters.category);
      }

      // Применяем общее состояние фильтров к сетке товаров
      applyCombinedFilter();

      // Закрытие меню и скролл при клике из плавающей панели
      if (categoryList.contains(button) || asortimentList.contains(button)) {
        setMenuOpen(false);
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
  

  // Закрытие по Escape и клику вне области панели
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setMenuOpen(false); menuToggle.focus(); } });
  document.addEventListener("click", (e) => {
    if (menuToggle.getAttribute("aria-expanded") === "true" && !e.target.closest(".floating-menu")) {
      setMenuOpen(false);
    }
  });

  menuPanel.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener("click", () => setMenuOpen(false)));

  // Первая сборка витрины
  applyCombinedFilter();
});