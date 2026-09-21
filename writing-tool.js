(function () {
    const form = document.querySelector('#writing-tool-form');
    if (!form) return;

    const result = document.querySelector('#writing-tool-result');
    const output = document.querySelector('#writing-tool-output');
    const openers = { warm: 'I wanted to reach out because', direct: 'I’m getting in touch to', curious: 'I’ve been thinking about', playful: 'A small thought I wanted to share:' };
    const closers = { warm: 'Would love to hear what you think.', direct: 'If this sounds useful, I’d be glad to take it forward.', curious: 'I’d be curious to hear how this lands with you.', playful: 'No pressure at all — just thought it might make your day a little more interesting.' };
    let draft = '';

    function value(name, fallback) {
        const field = form.elements[name];
        return (field.value || '').trim().replace(/\s+/g, ' ') || fallback;
    }

    function makeDraft(event) {
        if (event) event.preventDefault();
        const kind = form.elements.kind.value;
        const audience = value('audience', 'you');
        const point = value('point', 'share an idea I have been working on');
        const tone = form.elements.tone.value;
        const detail = value('detail', '');
        const idea = point.charAt(0).toLowerCase() + point.slice(1);
        let text;
        if (kind === 'bio') text = `I’m someone who likes to ${idea}. ${detail ? `${detail.charAt(0).toUpperCase() + detail.slice(1)}. ` : ''}I care about clear thinking, useful tools, and the small details that make good work feel human.`;
        else if (kind === 'introduction') text = `Hi ${audience},\n\n${openers[tone]} ${idea}. ${detail ? `A little context: ${detail}. ` : ''}I’m always interested in thoughtful problems and the people building their way through them.\n\n${closers[tone]}\n\nBest,\nNandana`;
        else if (kind === 'note') text = `Hi ${audience},\n\n${openers[tone]} ${idea}. ${detail ? `It reminded me that ${detail.toLowerCase()}. ` : ''}I’m sharing it because it felt worth pausing on, even if we don’t have the whole answer yet.\n\n${closers[tone]}`;
        else text = `Hi ${audience},\n\n${openers[tone]} ${idea}. ${detail ? `One detail I keep coming back to is that ${detail.toLowerCase()}. ` : ''}No need for a long reply — even a quick signal would help me know what to do next.\n\n${closers[tone]}\n\nNandana`;
        draft = text;
        output.textContent = text;
        result.hidden = false;
    }

    form.addEventListener('submit', makeDraft);
    document.querySelector('#another-writing-draft').addEventListener('click', makeDraft);
    document.querySelector('#copy-writing-draft').addEventListener('click', function () {
        navigator.clipboard.writeText(draft).then(function () { this.textContent = 'Copied ✓'; }.bind(this));
    });
}());
