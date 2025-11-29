import { useState, useRef, useEffect, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Smile, Image as ImageIcon } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

export default function RichTextEditor({ value, onChange, placeholder = "Write something...", compact = false }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const quillRef = useRef(null);

  // Handle paste events for images
  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const handlePaste = (e) => {
      const clipboard = e.clipboardData;
      if (!clipboard) return;

      const items = clipboard.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
              alert('Image must be less than 5MB');
              return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target.result;
              const range = editor.getSelection(true);
              editor.insertEmbed(range.index, 'image', base64);
              editor.setSelection(range.index + 1);
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    const editorRoot = editor.root;
    editorRoot.addEventListener('paste', handlePaste);
    
    return () => {
      editorRoot.removeEventListener('paste', handlePaste);
    };
  }, []);

  // Custom image handler for toolbar button
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const editor = quillRef.current?.getEditor();
        if (editor) {
          const range = editor.getSelection(true);
          editor.insertEmbed(range.index, 'image', e.target.result);
          editor.setSelection(range.index + 1);
        }
      };
      reader.readAsDataURL(file);
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: compact 
        ? [['bold', 'italic', 'link', 'image']]
        : [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
          ],
      handlers: {
        image: imageHandler
      }
    },
  }), [compact]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image'
  ];

  const handleEmojiClick = (emojiData) => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const cursorPosition = editor.getSelection()?.index || 0;
      editor.insertText(cursorPosition, emojiData.emoji);
      editor.setSelection(cursorPosition + emojiData.emoji.length);
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className={`rich-text-editor ${compact ? 'rich-text-compact' : ''}`}
      />
      
      <div className="absolute bottom-2 right-2 flex gap-2 z-10">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Add emoji"
        >
          <Smile size={20} className="text-gray-400" />
        </button>
      </div>

      {showEmojiPicker && (
        <div className="absolute bottom-12 right-0 z-50">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme="dark"
            width={320}
            height={400}
          />
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-1">
        Tip: Paste screenshots directly or click the image icon to upload
      </p>
    </div>
  );
}
