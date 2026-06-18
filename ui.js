const backing = document.createElement('div');
backing.style.width = 'fit-content';
backing.style.zIndex = 10;
backing.style.position = 'absolute';
backing.style.bottom = '0px';
backing.style.right = '0px';
backing.style.background = 'white';
backing.style.padding = '8px';
backing.style.display = 'flex';
backing.style.flexDirection = 'column';

const selectType = document.createElement('select');
selectType.appendChild(new Option("Floor", "floor"));
selectType.appendChild(new Option("Wall", "wall"));
selectType.appendChild(new Option("Track", "track"));

backing.appendChild(selectType);

{
    const checkboxRow = document.createElement('div');
    checkboxRow.style.display = 'flex';
    checkboxRow.style.flexDirection = 'row';

    const checkbox = document.createElement('input');
    checkbox.type = "checkbox";

    const titleSpan = document.createElement("span");
    const title = document.createTextNode("Loop");
    titleSpan.appendChild(title);
    checkboxRow.appendChild(titleSpan);
    checkboxRow.appendChild(checkbox);

    backing.appendChild(checkboxRow);
}

document.body.appendChild(backing);
