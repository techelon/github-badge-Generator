class BadgeGenerator {
    constructor() {
        this.baseUrl = 'https://img.shields.io';
        this.currentCategory = 'build';
        this.generatedBadges = new Set();
        this.init();
    }

    init() {
        this.setupTimeUpdate();
        this.setupCategoryNavigation();
        this.setupButtons();
        this.setupCopyButton();
        this.setupThemeToggle();
        this.setupRepoLoader();
        // Show initial category
        this.showSection('build');
    }

    setupTimeUpdate() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toISOString().replace('T', ' ').substring(0, 19);
            document.getElementById('current-time').textContent = timeString;
        };
        updateTime();
        setInterval(updateTime, 1000);
    }

    setupCategoryNavigation() {
        const navButtons = document.querySelectorAll('.category-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                navButtons.forEach(btn => {
                    btn.classList.remove('bg-indigo-600', 'text-white');
                    btn.classList.add('bg-gray-200', 'hover:bg-gray-300');
                });

                // Add active class to clicked button
                button.classList.remove('bg-gray-200', 'hover:bg-gray-300');
                button.classList.add('bg-indigo-600', 'text-white');

                // Show corresponding section
                const category = button.getAttribute('data-category');
                this.showSection(category);
            });
        });
    }

    setupButtons() {
        // Generate Badge button
        document.getElementById('generate-badge').addEventListener('click', () => {
            this.generateBadge();
        });

        // Reset button
        document.getElementById('reset-preview').addEventListener('click', () => {
            this.resetPreview();
        });
    }

    setupCopyButton() {
        const copyButton = document.getElementById('copy-markdown');
        copyButton.addEventListener('click', () => {
            const markdown = document.getElementById('markdown-output');
            navigator.clipboard.writeText(markdown.value)
                .then(() => {
                    this.showToast('Copied to clipboard!');
                })
                .catch(() => {
                    this.showToast('Failed to copy!', 'error');
                });
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const icon = themeToggle.querySelector('i');
            icon.classList.toggle('fa-moon');
            icon.classList.toggle('fa-sun');
        });
    }

    setupRepoLoader() {
        document.getElementById('load-repo').addEventListener('click', () => {
            const repoInput = document.getElementById('repo-input');
            if (repoInput.value) {
                this.loadRepositoryInfo(repoInput.value);
            } else {
                this.showToast('Please enter a repository name!', 'error');
            }
        });
    }

    showSection(category) {
        this.currentCategory = category;
        // Hide all sections
        document.querySelectorAll('.badge-section').forEach(section => {
            section.style.display = 'none';
        });
        // Show selected section
        const selectedSection = document.getElementById(`${category}-section`);
        if (selectedSection) {
            selectedSection.style.display = 'block';
        }
    }

    generateBadge() {
        const style = document.getElementById('badge-style').value;
        const color = document.getElementById('badge-color').value;
        const repo = document.getElementById('repo-input').value;

        if (!repo) {
            this.showToast('Please enter a repository name!', 'error');
            return;
        }

        let badges = [];
        switch (this.currentCategory) {
            case 'build':
                badges = this.generateBuildBadges(repo, style);
                break;
            case 'testing':
                badges = this.generateTestingBadges(repo, style);
                break;
            case 'package':
                badges = this.generatePackageBadges(style);
                break;
            // Add other categories here
        }

        this.updatePreview(badges);
    }

    generateBuildBadges(repo, style) {
        const badges = [];
        const ciPlatform = document.querySelector('select[name="ci-platform"]').value;
        const workflow = document.querySelector('input[name="workflow"]').value;
        const deployPlatform = document.querySelector('select[name="deploy-platform"]').value;
        const environment = document.querySelector('select[name="environment"]').value;

        // CI Badge
        badges.push(`${this.baseUrl}/github/workflow/status/${repo}/${workflow || 'main.yml'}?style=${style}`);
        
        // Deployment Badge
        badges.push(`${this.baseUrl}/deployment/${deployPlatform}/${repo}/${environment}?style=${style}`);

        return badges;
    }

    generateTestingBadges(repo, style) {
        const badges = [];
        const service = document.querySelector('select[name="coverage-service"]').value;
        const threshold = document.querySelector('input[name="coverage-threshold"]').value;
        const branch = document.querySelector('input[name="test-branch"]').value;

        // Coverage Badge
        if (service === 'codecov') {
            badges.push(`${this.baseUrl}/codecov/c/github/${repo}?style=${style}`);
        } else if (service === 'coveralls') {
            badges.push(`${this.baseUrl}/coveralls/github/${repo}?style=${style}`);
        }

        // Tests Badge
        badges.push(`${this.baseUrl}/github/workflow/status/${repo}/tests?label=tests&style=${style}`);

        return badges;
    }

    generatePackageBadges(style) {
        const badges = [];
        const packageName = document.querySelector('input[name="package-name"]').value;
        const registry = document.querySelector('select[name="package-registry"]').value;
        const showDownloads = document.querySelector('input[name="show-downloads"]').checked;
        const showVersion = document.querySelector('input[name="show-version"]').checked;

        if (showVersion) {
            badges.push(`${this.baseUrl}/${registry}/v/${packageName}?style=${style}`);
        }
        if (showDownloads) {
            badges.push(`${this.baseUrl}/${registry}/dt/${packageName}?style=${style}`);
        }

        return badges;
    }

    updatePreview(badges) {
        const preview = document.getElementById('badge-preview');
        const markdownOutput = document.getElementById('markdown-output');
        let markdown = '';

        badges.forEach(badgeUrl => {
            if (!this.generatedBadges.has(badgeUrl)) {
                this.generatedBadges.add(badgeUrl);
                
                // Create badge preview
                const wrapper = document.createElement('div');
                wrapper.className = 'relative group';
                
                const img = document.createElement('img');
                img.src = badgeUrl;
                img.alt = 'Badge';
                img.className = 'h-6';
                wrapper.appendChild(img);

                // Add remove button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'absolute -top-2 -right-2 hidden group-hover:block bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center';
                removeBtn.innerHTML = '×';
                removeBtn.onclick = () => {
                    wrapper.remove();
                    this.generatedBadges.delete(badgeUrl);
                    this.updateMarkdown();
                };
                wrapper.appendChild(removeBtn);

                preview.appendChild(wrapper);
                markdown += `![Badge](${badgeUrl})\n`;
            }
        });

        markdownOutput.value += markdown;
    }

    resetPreview() {
        document.getElementById('badge-preview').innerHTML = '';
        document.getElementById('markdown-output').value = '';
        this.generatedBadges.clear();
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        toastMessage.textContent = message;
        toast.classList.remove('translate-y-full');
        
        if (type === 'error') {
            toast.querySelector('div').classList.remove('bg-green-500');
            toast.querySelector('div').classList.add('bg-red-500');
        } else {
            toast.querySelector('div').classList.remove('bg-red-500');
            toast.querySelector('div').classList.add('bg-green-500');
        }

        setTimeout(() => {
            toast.classList.add('translate-y-full');
        }, 3000);
    }

    async loadRepositoryInfo(repo) {
        try {
            const response = await fetch(`https://api.github.com/repos/${repo}`);
            const data = await response.json();

            if (response.ok) {
                this.showToast('Repository loaded successfully!');
                // You can automatically fill some fields based on the repository data
                // For example, setting the default branch, etc.
            } else {
                this.showToast(data.message || 'Failed to load repository!', 'error');
            }
        } catch (error) {
            this.showToast('Failed to load repository!', 'error');
        }
    }
}

// Initialize the badge generator when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BadgeGenerator();
});