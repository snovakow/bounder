const backing = document.createElement('div');
backing.style.width = 'fit-content';
backing.style.zIndex = 10;
backing.style.position = 'absolute';
backing.style.top = '100px';
backing.style.left = '0px';

document.body.appendChild(backing);

const content = document.createElement('div');
content.style.width = '100px';
content.style.height = '100px';
content.style.backgroundColor = 'White';

const button = document.createElement('button');
button.textContent = "Separate";
button.onclick = () => {
    var newWindow = window.open();

    const content = newWindow.opener.document.createElement('div');
    content.style.width = '100px';
    content.style.height = '100px';
    content.style.backgroundColor = 'White';
    content.style.color = 'Black';
    content.appendChild(newWindow.opener.document.createTextNode("Hello!"));

    newWindow.opener.document.body.appendChild(content);
    console.log(newWindow);
}
content.appendChild(button);

backing.appendChild(content);
